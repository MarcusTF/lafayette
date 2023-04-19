import { RequestHandler } from "express"
import { OpenAIMessageStruct } from "guards"
import openAI, {
  MAX_CONTEXT_TOKENS,
  MAX_RESPONSE_TOKENS,
  countTokens,
  doesNeedMoreContext,
  generateUserPrompt,
  getLafayettePrompt,
  stripAllAdditionalContext,
  trimMessageThread,
} from "services/openai.service"
import supabase from "services/supabase.service"
import { StructError, array, assert, is } from "superstruct"
import produce from "immer"
import {
  ChatCompletionResponseMessage,
  CreateChatCompletionRequest,
  CreateChatCompletionResponse,
  CreateChatCompletionResponseChoicesInner,
} from "openai"

const getAdditionalContext = async (prompt: string) => {
  const {
    data: {
      data: [{ embedding }],
    },
  } = await openAI.createEmbedding({
    input: prompt,
    model: "text-embedding-ada-002",
  })

  const { data, error } = await supabase.rpc("vector_search", {
    vector: embedding,
    entries: 5,
  })

  if (!data?.length) return ""

  let context = ""
  let tokens = 0

  for (const result of data) {
    if (tokens > MAX_CONTEXT_TOKENS - 100) break
    const newCount = countTokens(result.body) + tokens
    if (newCount > MAX_CONTEXT_TOKENS) continue
    context += result.body + " "
    tokens = newCount
  }

  return context
}

const get: RequestHandler = async (request, response) => {}

const post: RequestHandler = async ({ body, headers }, response) => {
  try {
    response.setHeader("Content-Type", "text/event-stream")
    response.setHeader("Cache-Control", "no-cache")
    response.setHeader("Connection", "keep-alive")
    response.flushHeaders()

    const userResponse = await supabase.auth.getUser(headers.authorization?.split("Bearer ")[1] || "")
    if (!userResponse.data.user) {
      return response.status(401).write("event: error\n" + "data: Unauthorized\n\n", e => response.end())
    }
    const userName: string | undefined =
      userResponse?.data?.user?.user_metadata?.full_name || userResponse?.data?.user?.email || undefined

    const { messages } = body
    if (!is(messages, array())) {
      try {
        assert(messages, array())
      } catch (e) {
        console.error(e)
      } finally {
        return response.status(422).write("event:error\ndata: Invalid messages.\n\n", () => response.end())
      }
    }
    const validMessages = messages.filter<ChatCompletionResponseMessage>(
      (message): message is ChatCompletionResponseMessage => OpenAIMessageStruct.is(message)
    )

    const systemMessageCount = validMessages.filter(({ role }) => role === "system").length
    if (systemMessageCount > 1)
      return response.status(400).write("event:error\ndata: Too many system messages.\n\n", () => response.end())

    const validMessagesWithSystemMessage =
      systemMessageCount === 0
        ? [{ content: getLafayettePrompt(userName), role: "system" } as ChatCompletionResponseMessage, ...validMessages]
        : validMessages.map(message => {
            if (message.role === "system") return { ...message, content: getLafayettePrompt(userName) }
            return message
          })

    const messagesStrippedOfContext = stripAllAdditionalContext(validMessagesWithSystemMessage)
    const messagesWithNewestRemoved = messagesStrippedOfContext.slice(0, -1)
    const newest = messagesStrippedOfContext[messagesStrippedOfContext.length - 1]
    const prompt = newest?.content

    if (!prompt) {
      response.status(400).write("event: error\n" + "data: Missing prompt\n\n", () => response.end())
    }
    const needsContext = await doesNeedMoreContext(prompt)

    const context = needsContext && (await getAdditionalContext(prompt))

    const userPromptWithInjectedContext = context ? generateUserPrompt(context, prompt) : prompt
    const newestWithInjectedContext = { ...newest, content: userPromptWithInjectedContext }

    const finalUntrimmedMessageThread = [...messagesWithNewestRemoved, newestWithInjectedContext]
    const finalMessageThread = trimMessageThread(finalUntrimmedMessageThread).thread

    const chatRequestOpts: CreateChatCompletionRequest = {
      model: "gpt-3.5-turbo",
      messages: finalMessageThread,
      temperature: 0.9,
      stream: true,
    }

    const moderationRes = await openAI.createModeration({
      model: "text-moderation-latest",
      input: userPromptWithInjectedContext,
    })

    const { results } = moderationRes.data

    const isSafe = !results.some(({ flagged }) => flagged)
    if (!isSafe) return response.status(400).write("data: Message did not pass moderation.\n\n", () => response.end())

    const completionResponse = await openAI.createChatCompletion(chatRequestOpts, { responseType: "stream" })

    let completionResponseMessage = ""
    const completionStream = completionResponse.data as unknown as NodeJS.ReadableStream
    completionStream.on("data", (chunk: Buffer) => {
      console.log(chunk.toString())
      if (chunk.toString().includes("[DONE]")) {
        response.write(`event: thread\ndata: ${chunk}\n\n`, () => response.end())
        response.end()
      }
      // parse the chunk to a string and concat it to the completionResponseMessage
      // if the chunk contains [DONE] then end the response
      // else write the chunk to the response
      completionResponseMessage += chunk.toString().split("data: ")
      response.write(`event: message\n${chunk}`, error => {
        if (error) console.error(error)
      })
    })
    // response.write(`event: message\n${completionResponse.data}`, error => {
    //   if (error) console.error(error)
    //   if (completionResponse.data.choices?.[0]?.message?.content) {
    //     completionResponseMessage += completionResponse.data.choices?.[0]?.message?.content
    //   }
    //   if (completionResponse.data.choices?.[0]?.message?.content === "[DONE]") {
    //     response.end()
    //   }
    // })
    // const messageThreadWithResponse = produce(finalMessageThread, draft => {
    //   draft.push({ role: "assistant", content: completionResponseMessage || "" })
    //   delete draft[0]
    // })
    // response.write("event: thread\ndata: " + JSON.stringify(messageThreadWithResponse) + "\n\n")
  } catch (err) {
    console.error(err)
    return void response.status(500).write("event: error\ndata: Internal Server Error\n\n", () => response.end())
  }
}

export default {
  post,
}
