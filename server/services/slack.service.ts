import { App } from "@slack/bolt"
import { stripIndents } from "common-tags"
import capitalize from "lodash/capitalize"

import { Mention } from "types"
import { getQuip } from "utils"

import { port, port2 } from "../constants"
import supabase from "./supabase.service"

if (!process.env.SLACK_APP_TOKEN) throw new Error("Missing SLACK_APP_TOKEN")
if (!process.env.SLACK_BOT_TOKEN) throw new Error("Missing SLACK_BOT_TOKEN")

const slack = new App({
  appToken: process.env.SLACK_APP_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  token: process.env.SLACK_BOT_TOKEN,
})

export async function notifySlackUser(mention: Mention, channelId: string) {
  return await slack.client.chat.postMessage({
    username: `Lafayette`,
    blocks: [
      {
        type: "divider",
      },
      {
        type: "context",
        elements: [
          {
            alt_text: "Shortcut",
            image_url: "https://pbs.twimg.com/profile_images/1423353258127462403/b3H7GdwV_400x400.png",
            type: "image",
          },
          {
            type: "mrkdwn",
            text: `*${mention.author}* mentioned you in a <${mention.appUrl}|Shortcut comment>${
              mention.workspace.name ? ` in the *"${capitalize(mention.workspace.name)}"* workspace` : ""
            }.`,
          },
        ],
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `${mention.text?.[2990] ? mention.text?.slice(0, 2900) + "..." : mention.text}`,
        },
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: `View ${mention.text?.[2990] ? "the rest " : ""}in Shortcut`,
            },
            style: "primary",
            url: `${mention.appUrl}`,
          },
        ],
      },
      {
        type: "divider",
      },
      {
        type: "context",
        elements: [
          {
            alt_text: "Lafayette",
            image_url: "https://i.imgur.com/60YsZdC.png",
            type: "image",
          },
          {
            type: "mrkdwn",
            text: getQuip(),
          },
        ],
      },
    ],
    channel: channelId,
    icon_url: "https://i.imgur.com/60YsZdC.png",
    mrkdwn: true,
    text: `${mention.text}`,
  })
}

// slack.command("/lafayette", async ({ command, ack, say, context }) => {
//   console.log("Received command", command)

//   await ack()
//   command.text = command.text?.trim()
//   say({
//     as_user: true,
//     mrkdwn: true,
//     text: command.text,
//     channel: command.channel_id,
//   })
//   if (!command.text) {
//     return void (await say("Please provide a prompt."))
//   }

//   const { text, channel_name, user_id: user } = command

//   const historyRes = await (channel_name === "directmessage"
//     ? slack.client.im.history({
//         channel: command.channel_id,
//         limit: 10,
//       })
//     : slack.client.conversations.history({
//         channel: command.channel_id,
//         limit: 10,
//       }))

//   const messages = historyRes?.messages as ConversationsHistoryResponse["messages"]

//   const userData = await slack.client.users.profile.get({
//     user,
//   })

//   const userName = userData.profile?.real_name

//   const chatThread =
//     messages &&
//     messages
//       ?.filter(({ text }) => typeof text === "string")
//       ?.map<ChatCompletionRequestMessage>(message => ({
//         role: message.user === context.botUserId ? "assistant" : "user",
//         content: message.text as string,
//       }))

//   const userMessage: ChatCompletionRequestMessage = {
//     role: "user",
//     content: text,
//   }

//   const requestThreadMinusLatest: ChatCompletionRequestMessage[] = [
//     {
//       role: "system",
//       content: getLafayettePrompt(userName, true),
//     },
//     ...(chatThread || []),
//   ]

//   const ref = await say({
//     text: "Thinking...",
//     mrkdwn: true,
//     channel: command.channel_id,
//   })

//   if (!userMessage.content) throw new ChatError("Missing prompt")

//   console.log("Moderating message content...")
//   const isSafe = await moderateMessageContent(userMessage.content)
//   if (!isSafe) throw new ChatError("Message did not pass moderation.")

//   console.log("Injecting context and trimming...")
//   const chatCompletionThread = await injectContextAndTrim(userMessage, requestThreadMinusLatest)

//   console.log("Streaming completion...")
//   await streamCompletionSlack(chatCompletionThread, ref, slack.client, command)
// })

// slack.message(async ({ message, say, context }) => {
//   const { channel_type } = message

//   if (channel_type !== "im") return
//   if (!("text" in message && typeof message.text === "string")) return
//   const { text, user } = message

//   const { messages } = await slack.client.conversations.history({
//     channel: message.channel,
//     limit: 10,
//   })

//   const chatThread = messages
//     ?.filter(({ text }) => typeof text === "string")
//     ?.map<ChatCompletionRequestMessage>(message => ({
//       role: message.user === context.botUserId ? "assistant" : "user",
//       content: message.text as string,
//     }))

//   const userName = (
//     await slack.client.users.profile.get({
//       user,
//     })
//   ).profile?.real_name_normalized

//   const userMessage: ChatCompletionRequestMessage = {
//     role: "user",
//     content: text,
//   }

//   const requestThreadMinusLatest: ChatCompletionRequestMessage[] = [
//     {
//       role: "system",
//       content: getLafayettePrompt(userName, true),
//     },
//     ...(chatThread || []),
//   ]

//   const ref = await say("Thinking...")

//   if (!userMessage.content) throw new ChatError("Missing prompt")

//   console.log("Moderating message content...")
//   const isSafe = await moderateMessageContent(userMessage.content)
//   if (!isSafe) throw new ChatError("Message did not pass moderation.")

//   console.log("Injecting context and trimming...")
//   const chatCompletionThread = await injectContextAndTrim(userMessage, requestThreadMinusLatest)

//   console.log("Streaming completion...")
//   await streamCompletionSlack(chatCompletionThread, ref, slack.client, message)
// })

// const streamCompletionSlack = async (
//   chatCompletionThread: ChatCompletionRequestMessage[],
//   ref: ChatPostMessageResponse,
//   slackClient: WebClient,
//   message: KnownEventFromType<"message"> | SlashCommand
// ) => {
//   const completionResponse = await openCompletionStream(chatCompletionThread)

//   completionResponse.data.on("data", streamHandlerProducerSlack({ ref, message, slackClient }))
// }

// export function streamHandlerProducerSlack({
//   ref,
//   message,
//   slackClient,
// }: {
//   ref: ChatPostMessageResponse
//   message: KnownEventFromType<"message"> | SlashCommand
//   slackClient: WebClient
// }) {
//   let completionResponseMessage = ""

//   return async function streamHandler(chunk: Buffer) {
//     if (chunk.toString().includes("[DONE]")) {
//       console.log("Stream completed.")
//       return
//     }
//     completionResponseMessage = concatChunks(completionResponseMessage, chunk)

//     if ((ref.ts && message.channel) || message.channel_id) {
//       void (await slackClient.chat.update({
//         channel: message.channel || message.channel_id,
//         ts: ref.ts,
//         text: completionResponseMessage,
//       }))
//     }
//   }
// }

slack.event("app_home_opened", async ({ event, client, logger, context }) => {
  try {
    const { botUserId } = context
    const { profile } = await slack.client.users.profile.get({
      user: botUserId,
    })
    const img = profile?.image_192
    const [protocol, domain] = process.env.APP_URL?.split?.("://") || ["http", "localhost:5137"]
    const chatUrl = `${protocol}://chat.${domain}`
    const { user } = event
    const info = await client.users.info({ user })
    const name = info.user?.profile?.real_name || "there"
    const isActive = await supabase.from("slack_user").select("active").eq("id", user).single()
    await client.views.publish({
      user_id: user,
      view: {
        type: "home",
        blocks: [
          {
            type: "image",
            image_url: img,
            alt_text: "Lafayette, the good-est dog there ever was",
          },
          {
            type: "header",
            text: {
              type: "plain_text",
              text: `:poodle: Hi ${name}! :wave:`,
              emoji: true,
            },
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `My dog training is going well! I can _*FETCH*_ _and_ I can _*SPEAK*_!`,
            },
          },
          {
            type: "divider",
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: stripIndents`*Want me to _FETCH_ your shortcut mentions?* :bone:
              >_Authorize me to access your Shortcut mentions across all of your shortcut workspaces. After you've authorized me, I'll DM you with the message whenever you're mentioned in a Shortcut comment!_
              `,
            },
            accessory: {
              type: "button",
              text: {
                type: "plain_text",
                text: isActive ? "Disable Shortcut Sync" : "Sync Shortcut Mentions :dog::right_anger_bubble:",
                emoji: true,
              },
              value: "sync_shortcut_mentions",
              action_id: "sync_shortcut_mentions",
              style: isActive ? "danger" : "primary",
              url: process.env.APP_URL + (isActive ? "/" : "/login"),
            },
          },

          {
            type: "divider",
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: stripIndents`*My most impressive trick yet, I can _SPEAK_!* :right_anger_bubble:
              >_Chat with me! Powered by AI, I can talk about just about anything you want! I even know a bit about Haneke Design!_`,
            },
            accessory: {
              type: "button",
              text: {
                type: "plain_text",
                text: "Chat with Lafayette :speech_balloon:",
                emoji: true,
              },
              value: "chat_with_lafayette",
              action_id: "chat_with_lafayette",
              style: "primary",
              url: chatUrl,
            },
          },
          {
            type: "divider",
          },
          {
            type: "context",
            elements: [
              {
                type: "mrkdwn",
                text: "If you have any issues, please reach out to <@U025C85LM6U>.",
              },
            ],
          },
        ],
      },
    })
    logger.info("Published home tab for user: ", user)
  } catch (error) {
    logger.error(error)
  }
})

slack
  .start(port2 || port + 1)
  .then(() => {
    console.log("⚡️ Bolt app is running on port " + (port2 || port + 1) + "!")
  })
  .catch(error => {
    console.error(error)
  })

export default slack
