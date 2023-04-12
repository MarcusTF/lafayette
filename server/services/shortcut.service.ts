import type { User } from "@supabase/supabase-js"

import axios from "axios"
import { array } from "superstruct"

import { ShortcutMember, SupabaseDatabase, WorkspaceRes } from "types"
import { WorkspaceResStruct, isShortcutMemberArray } from "guards"
import supabase from "./supabase.service"

export const updateShortcutUsers = async (): Promise<[string, ResponseInit]> => {
  try {
    const { data: workspaceData, error: workspaceError } = await supabase.from("shortcut_workspaces").select(
      `
        id, token, shortcut_users: shortcut_user(
          id, user,
          slack_user(*)
        )
      `
    )

    if (workspaceError) throw workspaceError
    if (!workspaceData)
      return [
        "No workspaces found",
        {
          headers: { "Content-Type": "application/json" },
          status: 200,
        },
      ]

    WorkspaceResStruct.assert(workspaceData)

    const {
      data: { users: authUsers },
      error: authError,
    } = await supabase.auth.admin.listUsers()

    if (authError) throw authError

    const shortcutMembers = await getShortcutMembersByWorkspace(workspaceData, authUsers, true)

    if (!shortcutMembers?.length)
      return [
        "No members found",
        {
          headers: { "Content-Type": "application/json" },
          status: 200,
        },
      ]

    const { error } = await supabase
      .from("shortcut_user")
      .upsert(shortcutMembers, { onConflict: "id", ignoreDuplicates: false })
    if (error) throw error

    console.log("Fetched Shortcut members")
    return [
      "Success",
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      },
    ]
  } catch (error) {
    console.error(error)
    return [
      JSON.stringify({ error }),
      {
        headers: { "Content-Type": "application/json" },
        status: 400,
      },
    ]
  }
}

/** Fetches and parses Shortcut members and returns them grouped by workspace, or, optionally, flattened */
async function getShortcutMembersByWorkspace<F extends boolean>(
  workspaceData: WorkspaceRes[],
  authUsers: User[],
  flat?: F
): Promise<
  F extends true
    ? SupabaseDatabase.shortcut_user[]
    : {
        workspace: string
        members: SupabaseDatabase.shortcut_user[]
      }[]
> {
  const vals = (
    await Promise.all(
      workspaceData.flatMap(async workspace => {
        if (array().is(workspace)) return []
        if (!workspace?.token) return []

        const shortcutUsers = workspace.shortcut_users

        const { data: shortcutApiMembers } = await axios.get<unknown>("https://api.app.shortcut.com/api/v3/members", {
          headers: {
            "Content-Type": "application/json",
            "Shortcut-Token": workspace.token,
          },
        })

        if (!isShortcutMemberArray(shortcutApiMembers)) {
          console.error("Failed to validate Shortcut members", shortcutApiMembers)
          return []
        }

        const members = shortcutApiMembers
          .flatMap(member => {
            const user = authUsers?.find?.(authUser => authUser.email === member.profile.email_address) || null
            const shortcutUser = shortcutUsers?.find?.(shortcutUser => shortcutUser?.user === user?.id) || null
            let slackUser: {
              active?: boolean
              id: string
              user?: string | null
            } | null = null

            if (shortcutUser) {
              const parsedSlack = Array.isArray(shortcutUser?.slack_user)
                ? shortcutUser?.slack_user[0]
                : shortcutUser?.slack_user
              slackUser = parsedSlack?.user === user ? parsedSlack : null
            }
            if (!slackUser && user) {
              slackUser = { id: user?.user_metadata?.provider_id }
            }
            let slack_id = null
            slack_id = slackUser?.id || null

            if (!slack_id) return []

            return [
              {
                id: member.id,
                slack_id,
                user: user?.id || null,
                workspace: workspace.id,
              },
            ]
          })
          .flat()

        return flat
          ? members
          : [
              {
                workspace: workspace.id,
                members,
              },
            ]
      })
    )
  ).flat()

  return vals as F extends true
    ? SupabaseDatabase.shortcut_user[]
    : { workspace: string; members: SupabaseDatabase.shortcut_user[] }[]
}

export async function fetchShortcutMembers(token: string) {
  return await axios.get<ShortcutMember[]>("https://api.app.shortcut.com/api/v3/members", {
    headers: {
      "Content-Type": "application/json",
      "Shortcut-Token": token,
    },
  })
}
