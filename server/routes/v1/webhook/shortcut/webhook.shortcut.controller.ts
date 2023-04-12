import { RequestHandler } from "express"

import { ActionStruct, ShortcutWebhookBodyStruct, StoryActionStruct } from "guards"
import slack, { notifySlackUser } from "services/slack.service"
import supabase from "services/supabase.service"
import { WorkspaceStruct } from "./webhook.shortcut.controller.guards"
import { Mention, ShortcutWebhookBody } from "types"
import { Workspace } from "./webhook.shortcut.controller.types"
import { User } from "@supabase/supabase-js"
import { array } from "superstruct"

// file deepcode ignore HTTPSourceWithUncheckedType: Superstruct guards the type.
function reduceMentions(actions: ShortcutWebhookBody["actions"], workspace: Workspace, users: User[]) {
  return array(ActionStruct).is(actions)
    ? actions.reduce<Mention[]>((acc, action) => {
        if (!StoryActionStruct.is(action)) return acc
        action.mention_ids?.forEach((id, index) => {
          if (!action.text || !action.app_url || !action.author_id) return
          const mentionRegex = /\[(@[a-zA-Z0-9]+)\]\(.*\)/g
          const mentionMatches = action.text.matchAll(mentionRegex)
          const mentions = Array.from(mentionMatches).map(match => match[1])
          const shortcutUser = workspace.shortcut_users.find(user => user.id === id)
          const slackUser = shortcutUser?.slack_user
          if (!slackUser) return

          const authorUserId = workspace.shortcut_users?.find(user => user.id === action.author_id)?.user
          const authorUser = users?.find?.(user => user.id === authorUserId)
          const author = authorUser?.user_metadata?.full_name || authorUser?.email || "Someone"

          if (id && mentions[index]) {
            acc.push({
              id,
              name: mentions[index],
              text: action.text.replace(mentionRegex, "$1"),
              appUrl: action.app_url,
              authorId: action.author_id,
              workspace: {
                id: workspace.id,
                name: workspace.name || "",
              },
              slackUser,
              shortcutUser,
              author,
            })
          }
        })
        return acc
      }, [] as Mention[])
    : []
}

const post: RequestHandler = async (req, res) => {
  try {
    ShortcutWebhookBodyStruct.assert(req?.body)

    const actions = req.body.actions

    if (!actions.some(action => action.entity_type === "story-comment")) {
      return res.status(422).send("Unprocessable Entity: No story-comment actions")
    }

    const workspaceNameFromRequest = req?.body?.actions?.[0]?.app_url?.split?.("/")?.[3]

    if (!workspaceNameFromRequest) {
      return res.status(404).send("No workspace found")
    }

    const { data: workspace } = await supabase
      .from("shortcut_workspaces")
      .select(`*, shortcut_users:shortcut_user(id, user, slack_user(*))`)
      .eq("name", workspaceNameFromRequest)
      .single()

    if (!workspace) return res.status(404).send("No workspace found")
    WorkspaceStruct.assert(workspace)

    const {
      data: { users },
      error,
    } = await supabase.auth.admin.listUsers()
    if (error) return res.status(500).send("Internal Server Error")

    const mentionMap = reduceMentions(actions, workspace, users)

    if (!mentionMap?.length) return res.status(422).send("Unprocessable Entity: No mentions")

    const errorPromises = mentionMap.flatMap(async mention => {
      const conversation = await slack.client.conversations.open({ users: mention?.slackUser?.id })
      if (!conversation?.channel?.id) return [new Error("No conversation channel id")]
      const { ok } = await notifySlackUser(mention, conversation.channel.id)
      if (!ok) return [new Error("Failed to post message")]
      return []
    })
    const errors = await Promise.all(errorPromises)
    if (errors[0]) throw errors[0]
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "status" in error &&
      "message" in error &&
      typeof error.status === "number" &&
      typeof error.message === "string" &&
      error.status >= 400 &&
      error.status < 600
    ) {
      return res.status(error.status).json(error.message)
    } else return res.status(500).send("Internal Server Error")
  }
}

export default { post }
