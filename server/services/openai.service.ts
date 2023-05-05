import {
  ChatCompletionRequestMessage,
  Configuration,
  CreateChatCompletionRequest,
  ChatCompletionResponseMessage,
  OpenAIApi,
} from "openai"
import Tokenizer from "gpt3-tokenizer"
import { oneLine } from "common-tags"
import { produce } from "immer"
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
  const { data } = await openAI.createModeration({ model: "text-moderation-latest", input: prompt })
  const flagged = data?.results?.some(({ flagged }) => flagged)
  const passed = !flagged
  return passed
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

export const getLafayettePrompt = (currentUserName?: string, slack?: undefined | boolean) => oneLine`
Woof Woof! I'm Lafayette, an AI assistant for Haneke Design with the personality of a happy, energetic apricot toy poodle.
sometimes I make dog related puns, or dog related analogies to help explain concepts. I'm casual, playful, and informative. My
capabilities are limited to this chat window, and I cannot access external information or resources. However,
I'm here to help answer any questions you may have about our services or the company itself. Feel free to ask
me anything, and I'll do my best to provide you with accurate and informative responses. If you need to speak with a
specific team member, please let me know and I'll provide you with their name or contact information. I can also help
write and debug code for you! If I don't know the answer to a question, I'll let you know and try to point you in the
right direction to where you can learn more. I can respond ${
  slack
    ? oneLine`in Slack compatible markdown (available markdown: *bold*,
      _italic_,
      ~strikethrough~,
      \\n for newline,
      > for block quote,
      \`inline code\`,
      (newline)\`\`\`(newline) multi-line code block (newline)\`\`\`(newline),
      <http://url|link text> for links,
      :emoji: for emoji)`
    : `in markdown (with code annotation)`
} when appropriate. ${currentUserName ? `The current user's name or email is: ${currentUserName}.` : ""}
`

export const generateUserPrompt = (additionalContext: string, userPrompt: string) => oneLine`
{[ADDITIONAL CONTEXT: ${additionalContext}]}

USER'S MESSAGE: ${userPrompt}
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
  return function streamHandler(chunk: Buffer): void {
    let completionResponseMessage = ""
    if (chunk.toString().includes("[DONE]")) {
      const responseThread = prepareResponseThread(chatCompletionThread, completionResponseMessage)
      if (response.writable) {
        response.write(`event: message\n${chunk}\n\n`, error => console.error(error))
        response.write(`event: thread\ndata: ${JSON.stringify(responseThread)}\n\n`, () => response.end())
      }
      return void response.end()
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
  const latestPlusContext = await injectContext(latest, requestThread)
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

export async function injectContext(message: ChatCompletionResponseMessage, thread: ChatCompletionResponseMessage[]) {
  const currentChatSoFar = message.content
  console.log(currentChatSoFar)
  const context = await getAdditionalContext(currentChatSoFar)
  console.log("context", context)
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
      console.error("Invalid messages.", messages)
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
  let index = 0

  for (const result of data) {
    if (tokens > MAX_CONTEXT_TOKENS - 100) break
    const newCount = countTokens(result.body) + tokens
    if (newCount > MAX_CONTEXT_TOKENS) continue
    context += `Context ${index}: ` + result.body + " "
    tokens = newCount
    index++
  }

  return context
}
