import { Request, RequestHandler, Response } from "express"
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
import { AxiosResponse } from "axios"

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

const post: RequestHandler = async (request, response) => {
  try {
    response.setHeader("Content-Type", "text/event-stream")
    response.setHeader("Cache-Control", "no-cache")
    response.setHeader("Connection", "keep-alive")
    response.flushHeaders()

    const messages = await validateData(request, response)
    if (!messages) return void response.status(400).write("event: error\ndata: No Messages\n\n", () => response.end())

    const newest = messages.pop()
    const prompt = newest?.content

    if (!prompt) return void response.status(400).write("event: error\ndata: Missing prompt\n\n", () => response.end())

    const isSafe = await moderateMessageContent(prompt)

    if (!isSafe)
      return response
        .status(400)
        .write("event: error\ndata: Message did not pass moderation.\n\n", () => response.end())

    const needsContext = await doesNeedMoreContext(prompt)

    const context = needsContext && (await getAdditionalContext(prompt))

    const promptWithContext = context ? generateUserPrompt(context, prompt) : prompt
    const messageWithContext = { ...newest, content: promptWithContext }

    const finalUntrimmedMessageThread = [...messages, messageWithContext]
    const finalMessageThread = trimMessageThread(finalUntrimmedMessageThread).thread

    const chatRequestOpts: CreateChatCompletionRequest = {
      model: "gpt-3.5-turbo",
      messages: finalMessageThread,
      temperature: 0.9,
      stream: true,
    }

    const completionResponse = (await openAI.createChatCompletion(chatRequestOpts, {
      responseType: "stream",
    })) as unknown as AxiosResponse<NodeJS.ReadableStream>

    let completionResponseMessage = ""
    const streamHandler = (chunk: Buffer) => {
      if (chunk.toString().includes("[DONE]")) {
        const messageThreadWithResponse = produce(finalMessageThread, draft => {
          completionResponseMessage && draft.push({ role: "assistant", content: completionResponseMessage })
          draft.shift()
        })

        const messageThreadWithResponseAndStrippedContext = stripAllAdditionalContext(messageThreadWithResponse)

        return (
          response.writable &&
          response.write(
            `event: thread\ndata: ${JSON.stringify(messageThreadWithResponseAndStrippedContext)}\n\n`,
            () => response.end()
          )
        )
      }
      completionResponseMessage = concatChunks(completionResponseMessage, chunk)

      response.writable &&
        response.write(`event: message\n${chunk}`, error => {
          if (error) console.error(error)
        })
    }

    completionResponse.data.on("data", streamHandler)
  } catch (err) {
    console.error(err)
    return void response.status(500).write("event: error\ndata: Internal Server Error\n\n", () => response.end())
  }
}

export default {
  post,
}
function concatChunks(completionResponseMessage: string, chunk: Buffer) {
  completionResponseMessage += chunk
    .toString()
    .split("data: ")
    .filter(Boolean)
    .map(v => JSON.parse(v.trim())?.choices?.[0]?.delta?.content?.replace?.(/\n/g, ""))
    .join("")
  return completionResponseMessage
}

async function moderateMessageContent(prompt?: string) {
  if (!prompt) throw new Error("Missing prompt")
  return (await openAI.createModeration({ model: "text-moderation-latest", input: prompt }))?.data?.results?.some(
    ({ flagged }) => flagged
  )
}

async function validateData(request: Request, response: Response): Promise<ChatCompletionResponseMessage[] | void> {
  const { headers } = request
  const userResponse = await supabase.auth.getUser(headers.authorization?.split("Bearer ")[1] || "")
  if (!userResponse.data.user) {
    return void response.status(401).write("event: error\n" + "data: Unauthorized\n\n", () => response.end())
  }
  const userName: string | undefined =
    userResponse?.data?.user?.user_metadata?.full_name || userResponse?.data?.user?.email || undefined

  const { messages } = request.body
  if (!is(messages, array())) {
    try {
      assert(messages, array())
    } catch (e) {
      console.error(e)
    } finally {
      return void response.status(422).write("event:error\ndata: Invalid messages.\n\n", () => response.end())
    }
  }

  // Remove system messages and malformed messages
  const validMessages = messages.filter<ChatCompletionResponseMessage>(
    (message): message is ChatCompletionResponseMessage => OpenAIMessageStruct.is(message) && message.role !== "system"
  )

  // Add system message
  const validMessagesWithSystemMessage = [
    { content: getLafayettePrompt(userName), role: "system" } as ChatCompletionResponseMessage,
    ...validMessages,
  ]

  return validMessagesWithSystemMessage
}
