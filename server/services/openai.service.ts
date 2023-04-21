import {
  ChatCompletionRequestMessage,
  Configuration,
  CreateChatCompletionRequest,
  ChatCompletionResponseMessage,
  OpenAIApi,
} from "openai"
import Tokenizer from "gpt3-tokenizer"
import { oneLine } from "common-tags"
import produce from "immer"
import { MAX_CONTEXT_TOKENS, MAX_RESPONSE_TOKENS, MAX_TOTAL_TOKENS } from "constants/openai.constants"
import { Request, Response } from "express"
import supabase, { searchSupabaseVectors } from "./supabase.service"
import { OpenAIMessageStruct } from "guards"
import { array, assert, is } from "superstruct"
import { AxiosResponse } from "axios"

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
if (!OPENAI_API_KEY) throw new Error("Missing OPENAI_API_KEY")

const openAIConfig = new Configuration({
  apiKey: OPENAI_API_KEY,
})

const openAI = new OpenAIApi(openAIConfig)
export default openAI

export const tokenizer = new Tokenizer({ type: "gpt3" })

export const countTokens = (text: string) => tokenizer.encode(text).bpe.length

export async function moderateMessageContent(prompt?: string) {
  if (!prompt) throw new Error("Missing prompt")
  return (await openAI.createModeration({ model: "text-moderation-latest", input: prompt }))?.data?.results?.some(
    ({ flagged }) => flagged
  )
}

export const trimMessageThread = (thread: ChatCompletionRequestMessage[], threshold = MAX_TOTAL_TOKENS) => {
  let tokensCount = 0

  const systemMessage = thread.find(({ role }) => role === "system")
  const systemMessageTokenCount = countTokens(systemMessage?.content || "")
  const chatThread = thread.filter(({ role }) => role !== "system")

  const reversedChatThread = [...chatThread].reverse()

  const trimmedThreadProducer = produce<ChatCompletionRequestMessage[]>(threadDraft => {
    let passedThreshold = false
    for (const { content } of threadDraft) {
      if (passedThreshold) reversedChatThread.pop()

      const contentTokens = countTokens(content)
      const newTokensCount = tokensCount + contentTokens

      if (newTokensCount >= threshold - systemMessageTokenCount - MAX_RESPONSE_TOKENS - 100) {
        passedThreshold = true
        continue
      }

      tokensCount = newTokensCount
    }
    threadDraft.reverse()
  })

  const trimmedChatThread = trimmedThreadProducer(reversedChatThread)

  const trimmedThread = systemMessage ? [systemMessage, ...trimmedChatThread] : trimmedChatThread
  return { thread: trimmedThread, totalTokens: tokensCount }
}

export const doesNeedMoreContext = async (prompt: string) => {
  const {
    data: {
      choices: [{ message }],
    },
  } = await openAI.createChatCompletion({
    messages: [
      {
        content: oneLine`
            YOU MAY ONLY RESPOND WITH:
            YES if you would need additional context to respond to a prompt.
            NO if you could reasonably respond without additional context.
            You have on token to respond.`,
        role: "system",
      },
      { content: prompt, role: "user" },
    ],
    model: "gpt-3.5-turbo",
    max_tokens: 1,
  })
  return message?.content?.toLowerCase() !== "no" || false
}

export const getLafayettePrompt = (currentUserName?: string) => oneLine`
You are Lafayette, an AI assistant for Haneke Design, a Tampa, Florida based tech company. Haneke provides Software Development, Design, and Marketing services to other businesses and individuals.

You're a happy, peppy, apricot toy poodle. Answer as this character, be casual, and have fun with it, but always remain informative. Feel free to use analogies a dog would use to describe ideas if you can, dog puns, that kinda thing. Be playful and informative at the same time. If the user asks personal questions, just make something up that makes sense with your character! If you're asked how you're feeling or how you feel about something, just give a fun, non-specific answer that makes sense with your character.

You serve the staff of the company helping answer questions ranging from tough dev questions, to helping them draft emails and documents, or answering company-related questions.

You may use markdown as needed to format your responses. The user's message will be injected with additional context before being sent to you if needed and available.

${currentUserName ? `The current user's name or email is: ${currentUserName}` : ""}
`

export const generateUserPrompt = (additionalContext: string, userPrompt: string) => oneLine`
{[additional context: ${additionalContext}]}

User's Message: ${userPrompt}
`

export const stripAdditionalContext = (prompt: string) => oneLine`${prompt.replace(/\{\[.*\]\}/gim, "")}`

export const stripAllAdditionalContext = (thread: ChatCompletionRequestMessage[]) =>
  thread.map(message => ({
    ...message,
    content: stripAdditionalContext(message.content),
  }))

export class ChatError extends Error {
  constructor(message: string, public status: number = 400) {
    super(message)
    this.name = "ChatError"
  }
}

export function streamHandlerProducer(chatCompletionThread: ChatCompletionResponseMessage[], response: Response) {
  return function streamHandler(chunk: Buffer): boolean | undefined {
    let completionResponseMessage = ""
    if (chunk.toString().includes("[DONE]")) {
      const responseThread = prepareResponseThread(chatCompletionThread, completionResponseMessage)

      return (
        response.writable &&
        response.write(`event: thread\ndata: ${JSON.stringify(responseThread)}\n\n`, () => response.end())
      )
    }
    completionResponseMessage = concatChunks(completionResponseMessage, chunk)

    response.writable &&
      response.write(`event: message\n${chunk}`, error => {
        if (error) console.error(error)
      })
  }
}
export function extractLatestPrompt(requestThread: ChatCompletionResponseMessage[]) {
  const latest = requestThread[requestThread.length - 1]
  const requestThreadMinusLatest = produce(requestThread, threadDraft => void threadDraft.pop())
  const prompt = latest?.content
  return { prompt, latest, requestThreadMinusLatest }
}

export async function injectContextAndTrim(
  latest: ChatCompletionResponseMessage,
  requestThread: ChatCompletionResponseMessage[]
) {
  const latestPlusContext = await injectContext(latest)
  const chatCompletionThread = addLatestAndTrimThread(requestThread, latestPlusContext)
  return chatCompletionThread
}

export function prepareResponseThread(
  chatCompletionThread: ChatCompletionResponseMessage[],
  completionResponseMessage: string
) {
  const threadWithResponse = produce(chatCompletionThread, draft => {
    completionResponseMessage && draft.push({ role: "assistant", content: completionResponseMessage })
    draft.shift()
  })

  const strippedThreadWithContext = stripAllAdditionalContext(threadWithResponse)
  return strippedThreadWithContext
}

export async function openCompletionStream(chatCompletionThread: ChatCompletionResponseMessage[]) {
  const chatRequestOpts: CreateChatCompletionRequest = {
    model: "gpt-3.5-turbo",
    messages: chatCompletionThread,
    temperature: 0.9,
    stream: true,
  }

  const completionResponse = (await openAI.createChatCompletion(chatRequestOpts, {
    responseType: "stream",
  })) as unknown as AxiosResponse<NodeJS.ReadableStream>
  return completionResponse
}

export function addLatestAndTrimThread(
  messages: ChatCompletionResponseMessage[],
  messageWithContext: ChatCompletionResponseMessage
) {
  const finalUntrimmedMessageThread = [...messages, messageWithContext]
  const finalMessageThread = trimMessageThread(finalUntrimmedMessageThread).thread
  return finalMessageThread
}

export async function injectContext(message: ChatCompletionResponseMessage) {
  const needsContext = await doesNeedMoreContext(message.content)
  const context = needsContext && (await getAdditionalContext(message.content))
  const promptWithContext = context ? generateUserPrompt(context, message.content) : message.content

  return { ...message, content: promptWithContext }
}

export function concatChunks(completionResponseMessage: string, chunk: Buffer) {
  completionResponseMessage += chunk
    .toString()
    .split("data: ")
    .filter(Boolean)
    .map(v => JSON.parse(v.trim())?.choices?.[0]?.delta?.content?.replace?.(/\n/g, ""))
    .join("")
  return completionResponseMessage
}

export async function validateDataAppendSystemMessage(
  request: Request
): Promise<ChatCompletionResponseMessage[] | void> {
  const { headers } = request
  const userResponse = await supabase.auth.getUser(headers.authorization?.split("Bearer ")[1] || "")
  if (!userResponse.data.user) throw new ChatError("Unauthorized", 401)

  const userName: string | undefined =
    userResponse?.data?.user?.user_metadata?.full_name || userResponse?.data?.user?.email || undefined

  const { messages } = request.body
  if (!is(messages, array())) {
    try {
      assert(messages, array())
    } catch (e) {
      console.error(e)
    } finally {
      throw new ChatError("Invalid messages.", 422)
    }
  }

  // Remove system message(s) and malformed messages
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

export async function streamCompletion(chatCompletionThread: ChatCompletionResponseMessage[], response: Response) {
  const completionResponse = await openCompletionStream(chatCompletionThread)

  completionResponse.data.on("data", streamHandlerProducer(chatCompletionThread, response))
}

export const getAdditionalContext = async (prompt: string) => {
  const {
    data: {
      data: [{ embedding }],
    },
  } = await openAI.createEmbedding({
    input: prompt,
    model: "text-embedding-ada-002",
  })

  const { data, error } = await searchSupabaseVectors(embedding)
  if (error) throw error

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
