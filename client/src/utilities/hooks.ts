import { useContext } from "react"
import axios from "axios"
import { MutationFunction, UseMutationOptions, UseQueryOptions, useMutation, useQuery } from "@tanstack/react-query"
import { PostgrestError } from "@supabase/supabase-js"

import { Context, supabase } from "context/context"
import { UserFlowContext } from "pages"
import { SetupSyncMutation, SetupSyncVariables } from "pages/Confirm/Confirm.types"
import { AppUser, parseSession } from "./utils"
import { ShortcutResponse } from "./types"
import { Database } from "supabase"

type SlackUser = Database["public"]["Tables"]["slack_user"]["Row"]

export const useGetSlackUserSupabase = (options?: UseQueryOptions<SlackUser>) => {
  const { user } = useContext(Context)
  const getSlackUserSupabase = async () => {
    const { data, error } = await supabase.from("slack_user").select("*").eq("user", user?.id).single()
    if (error) throw error
    return data
  }
  return useQuery<SlackUser>(["slackUserSupabase"], getSlackUserSupabase, options)
}

export const useGetShortcutIds = (options?: UseQueryOptions<ShortcutResponse>) => {
  const { user } = useContext(Context)
  const token = user?.auth?.access_token
  const getShortcutIds = async () =>
    (
      await axios.get<ShortcutResponse>(
        (import.meta.env.VITE_API_URL || "http://localhost:3000") +
          (`/${import.meta.env.VITE_API_VERSION}` || "/v1") +
          "/shortcut",
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: token,
          },
        }
      )
    ).data

  return useQuery<ShortcutResponse>(["shortcutIds"], getShortcutIds, {
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    ...options,
  })
}

export const useGetSession = (options?: UseQueryOptions<AppUser>) => {
  const { setUser } = useContext(Context)

  const getSession = async () => {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error

    if (data?.session) {
      const parsed = parseSession(data.session)
      return parsed
    }
    throw new Error("No session")
  }

  return useQuery<AppUser>(["session"], getSession, {
    ...(options || {}),
    onSuccess: data => {
      setUser(data)
      if (options && "onSuccess" in options && typeof options.onSuccess === "function") options.onSuccess(data)
    },
  })
}

export const useWatchAuthChanges = () => {
  const { user, setUser } = useContext(Context)
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_IN" && !user && session?.access_token) {
      const parsed = parseSession(session)
      setUser(parsed)
    }
  })
}

export const useUndoSync = (options?: UseMutationOptions) => {
  const { user } = useContext(Context)

  const undoSync: MutationFunction = async () => {
    const id = user?.identities?.[0]?.id
    if (!id) throw new Error("No slack id")
    const { error } = await supabase.from("slack_user").upsert([{ id, active: false }], {})
    if (error) throw error
    return null
  }
  return useMutation({
    mutationFn: undoSync,
    ...(options || {}),
  })
}

export const useSetupSync = (options: UseMutationOptions<void, PostgrestError, SetupSyncVariables>) => {
  const setupSync: SetupSyncMutation = async user => {
    try {
      const shortcut_users = user.shortcutIds?.flatMap(id =>
        id && user.id ? [{ id, user: user.id, slack_id: user.slackId }] : []
      )
      if (!user.slackId || !user.id || !shortcut_users)
        throw new Error("Every user must have a slack id and a user id and at least one shortcut id")
      await upsertSlack(user)
      await upsertShortcutUsers(shortcut_users)
      await activateUser(user)
    } catch (e) {
      throw e
    }
  }
  return useMutation({
    ...options,
    mutationFn: setupSync,
  })
}

export const useUserFlowContext = () => useContext(UserFlowContext)

export const useMainContext = () => useContext(Context)

export const useContexts = () => {
  const mainContext = useContext(Context)
  const userFlowContext = useContext(UserFlowContext)
  return { ...mainContext, ...userFlowContext }
}
async function activateUser(user: SetupSyncVariables) {
  if (!user.slackId) throw new Error("No slack id")
  const { error: error3 } = await supabase.from("slack_user").upsert({ id: user.slackId, active: true })
  if (error3) throw error3
}

async function upsertShortcutUsers(shortcut_users: { id: string; user: string; slack_id: string | undefined }[]) {
  const { error: error2 } = await supabase.from("shortcut_user").upsert(shortcut_users)
  if (error2) throw error2
}

async function upsertSlack(user: SetupSyncVariables) {
  if (!user.slackId) throw new Error("No slack id")
  if (!user.id) throw new Error("No user id")
  const { error } = await supabase.from("slack_user").upsert({ user: user.id, id: user.slackId }, { onConflict: "id" })
  if (error) throw error
}
