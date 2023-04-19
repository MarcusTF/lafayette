import { ChatCompletionRequestMessage, Configuration, CreateChatCompletionRequest, OpenAIApi } from "openai"
import { createParser, ParsedEvent, ReconnectInterval } from "eventsource-parser"
import Tokenizer from "gpt3-tokenizer"
import { oneLine } from "common-tags"
import produce from "immer"

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
if (!OPENAI_API_KEY) throw new Error("Missing OPENAI_API_KEY")

const openAIConfig = new Configuration({
  apiKey: OPENAI_API_KEY,
})

const openAI = new OpenAIApi(openAIConfig)

// export async function OpenAIStream(payload: CreateChatCompletionRequest) {
//   const encoder = new TextEncoder()
//   const decoder = new TextDecoder()

//   let counter = 0

//   const res = await openAI.createChatCompletion(payload)

//   const stream = new ReadableStream({
//     async start(controller) {
//       // callback
//       function onParse(event: ParsedEvent | ReconnectInterval) {
//         if (event.type === "event") {
//           const data = event.data
//           if (data === "[DONE]") {
//             controller.close()
//             return
//           }
//           try {
//             const json = JSON.parse(data)
//             const text = json.choices[0].delta?.content || ""
//             if (counter < 2 && (text.match(/\n/) || []).length) {
//               // this is a prefix character (i.e., "\n\n"), do nothing
//               return
//             }
//             const queue = encoder.encode(text)
//             controller.enqueue(queue)
//             counter++
//           } catch (e) {
//             // maybe parse error
//             controller.error(e)
//           }
//         }
//       }

//       // stream response (SSE) from OpenAI may be fragmented into multiple chunks
//       // this ensures we properly read chunks and invoke an event for each SSE event stream
//       const parser = createParser(onParse)
//       // https://web.dev/streams/#asynchronous-iteration
//       for await (const chunk of res.data as any) {
//         parser.feed(decoder.decode(chunk))
//       }
//     },
//   })

//   return stream
// }

export const tokenizer = new Tokenizer({ type: "gpt3" })

export const MAX_CONTEXT_TOKENS = 1000
export const MAX_RESPONSE_TOKENS = 1000
export const MAX_TOTAL_TOKENS = 4000

export const countTokens = (text: string) => tokenizer.encode(text).bpe.length

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
            YES if you would need additional context to answer a question.
            NO if you could reasonably answer without additional context.`,
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
  thread.map(messsage => ({
    ...messsage,
    content: stripAdditionalContext(messsage.content),
  }))

export default openAI
