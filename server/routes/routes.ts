import e from "express"
import { isShortcutWebhookBody } from "../types"
import { slack, supabase } from "../services"
import { getQuip, members } from "../utils"

const router = e.Router()

router.post("/webhook", async (req, res) => {
  console.log("Received webhook")
  console.log(req.body)
  if (!req.body) return void res.status(400).send("Bad Request")
  if (!isShortcutWebhookBody(req.body)) return void res.status(400).send("Bad Request")
  if (req.body.actions.length === 0) return void res.status(422).send("Unprocessable Entity: No actions")

  const actions = req.body.actions

  if (!actions.some(action => action.entity_type === "story-comment"))
    return void res.status(422).send("Unprocessable Entity: No story-comment actions")

  const mentionMap = actions.flatMap(action => {
    if (action.entity_type !== "story-comment" || action.text === undefined) return []
    const mentionRegex = /\[(@[a-zA-Z0-9]+)\]\(.*\)/g
    const mentionMatches = action.text.matchAll(mentionRegex)
    const mentions = Array.from(mentionMatches).map(match => match[1])

    return {
      mentions: action.mention_ids?.map?.((id, index) => ({ id, name: mentions[index] } || [])),
      text: action.text.replace(mentionRegex, "$1"),
      appUrl: action.app_url,
      authorId: action.author_id,
    }
  })

  type Mention = { id: string; name: string; text: string; appUrl: string; authorId: string }
  const flattenedMentions = mentionMap?.reduce?.<Mention[]>((acc, { mentions, text, appUrl, authorId }) => {
    if (!mentions) return acc
    const mapped = mentions?.flatMap(mention =>
      mention?.id && mention?.name && text && appUrl && authorId
        ? [
            {
              id: mention.id,
              name: mention.name,
              text: text,
              appUrl,
              authorId,
            },
          ]
        : []
    )
    return [...acc, ...mapped]
  }, [] as Mention[])

  const slackUsers = await supabase.from("slack_user").select("*").eq("active", true)
  const shortcutUsers = await supabase
    .from("shortcut_user")
    .select("*")
    .in(
      "id",
      flattenedMentions?.map?.(mention => mention.id)
    )

  const slackUsersWithShortcutUsers =
    slackUsers?.data?.flatMap?.(slackUser => {
      const shortcutUser = shortcutUsers?.data?.find?.(shortcutUser => shortcutUser.slack_id === slackUser.id)
      const relevantMention = flattenedMentions?.find?.(mention => mention.id === shortcutUser?.id)
      if (!shortcutUser) return []
      if (!relevantMention) return []
      if (!relevantMention.text) return []
      return {
        slackId: slackUser.id,
        shortcutId: shortcutUser.id,
        mentionName: relevantMention?.name,
        text: relevantMention.text,
        appUrl: relevantMention.appUrl,
        author: members.get()?.find?.(member => member.id === relevantMention.authorId)?.profile?.name,
      }
    }) || []

  const errorPromises = slackUsersWithShortcutUsers.flatMap(async ({ slackId, text, appUrl, author }) => {
    const conversation = await slack.client.conversations.open({ users: slackId })
    if (!conversation?.channel?.id) return [new Error("No conversation channel id")]
    const { ok } = await slack.client.chat.postMessage({
      username: `Lafayette`,
      blocks: [
        {
          type: "divider",
        },
        {
          type: "context",
          elements: [
            {
              type: "image",
              image_url: "https://pbs.twimg.com/profile_images/1423353258127462403/b3H7GdwV_400x400.png",
              alt_text: "Shortcut",
            },
            {
              type: "mrkdwn",
              text: `*${author}* mentioned you in a <${appUrl}|Shortcut comment>.`,
            },
          ],
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `${text?.[2990] ? text?.slice(0, 2900) + "..." : text}`,
          },
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: {
                type: "plain_text",
                text: `View ${text?.[2990] ? "the rest " : ""}in Shortcut`,
              },
              style: "primary",
              url: `${appUrl}`,
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
              type: "image",
              image_url: "https://i.imgur.com/60YsZdC.png",
              alt_text: "Lafayette",
            },
            {
              type: "mrkdwn",
              text: getQuip(),
            },
          ],
        },
      ],
      mrkdwn: true,
      text: `${text}`,
      channel: conversation.channel.id,
    })
    if (!ok) return [new Error("Failed to post message")]
    return []
  })

  const errors = await Promise.all(errorPromises)

  if (errors.length > 0) {
    return void res.status(500).send("Internal Server Error")
  }

  return void res.status(200).send("OK")
})

router.get("/shortcut", async (req, res) => {
  if (!req.headers.authorization) return void res.status(401).send("Unauthorized")
  const { data, error } = await supabase.auth.getUser(req.headers.authorization)
  if (!data.user) return void res.status(401).send("Unauthorized")
  if (error) return void res.status(error?.status || 401).send(error?.message || "Unauthorized")
  try {
    const currentMembers = members.get()
    const bestGuessMember = currentMembers.find((member: any) => member?.profile?.email_address === data.user.email)
    const options = currentMembers.map((member: any) => ({
      id: member?.id,
      name: member?.profile?.name,
      mentionName: member?.profile?.mention_name,
      email: member?.profile?.email_address,
    }))

    res.status(200).json({
      bestGuess: {
        id: bestGuessMember?.id,
        name: bestGuessMember?.profile?.name,
        mentionName: bestGuessMember?.profile?.mention_name,
        email: bestGuessMember?.profile?.email_address,
      },
      options,
    })
  } catch (error) {
    console.log(error)
    res.status(500).send("Internal Server Error")
  }
})

export default router
