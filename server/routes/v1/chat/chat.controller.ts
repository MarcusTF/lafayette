import { RequestHandler } from "express"
import {
  ChatError,
  extractLatestPrompt,
  injectContextAndTrim,
  moderateMessageContent,
  streamCompletion,
  validateDataAppendSystemMessage,
} from "services/openai.service"

const post: RequestHandler = async (request, response) => {
  try {
    response.setHeader("Access-Control-Allow-Origin", "*")
    response.setHeader("Content-Type", "text/event-stream")
    response.setHeader("Cache-Control", "no-cache")
    response.setHeader("Connection", "keep-alive")
    response.flushHeaders()

    // console.log("Request received:", request.body)

    console.log("Validating request data...")
    const requestThread = await validateDataAppendSystemMessage(request)
    if (!requestThread) throw new ChatError("No Messages")

    console.log("Extracting latest prompt...")
    const { latest, requestThreadMinusLatest } = extractLatestPrompt(requestThread)

    if (!latest.content) throw new ChatError("Missing prompt")

    console.log("Moderating message content...")
    const isSafe = await moderateMessageContent(latest.content)
    if (!isSafe) throw new ChatError("Message did not pass moderation.")

    console.log("Injecting context and trimming...")
    const chatCompletionThread = await injectContextAndTrim(latest, requestThreadMinusLatest)

    console.log("Streaming completion...")
    await streamCompletion(chatCompletionThread, response)
  } catch (err) {
    console.error(err)
    if (err instanceof ChatError)
      return void response.status(err.status).write(`event: error\ndata: ${err.message}\n\n`, () => response.end())
    return void response.status(500).write("event: error\ndata: Internal Server Error\n\n", () => response.end())
  }
}

export default {
  post,
}
