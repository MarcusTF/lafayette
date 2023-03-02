import { useContext } from "react"
import axios from "axios"
import { MutationFunction, UseMutationOptions, UseQueryOptions, useMutation, useQuery } from "@tanstack/react-query"
import { PostgrestError } from "@supabase/supabase-js"

import { Context, supabase } from "context"
import { UserFlowContext } from "pages"
import { SetupSyncMutation, SetupSyncVariables } from "pages/Confirm/Confirm.types"
import { AppUser, parseSession } from "./utils"
import { ShortcutResponse, SlackUser } from "./types"

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
      await axios.get<ShortcutResponse>(import.meta.env.API_URL || "http://localhost:3000/api" + "/shortcut", {
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
      })
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

export const useSetupSync = (options: UseMutationOptions<null, PostgrestError, SetupSyncVariables>) => {
  const setupSync: SetupSyncMutation = async ({ shortcutId, slackId, userId }) => {
    const { error } = await supabase.from("slack_user").upsert([{ id: slackId, user: userId }])
    if (error) throw error
    const { error: error2 } = await supabase
      .from("shortcut_user")
      .upsert([{ id: shortcutId, slack_id: slackId, user: userId }])
    if (error2) throw error2
    const { error: error3 } = await supabase.from("slack_user").upsert([{ id: slackId, active: true }], {})
    if (error3) throw error3
    return null
  }
  return useMutation({
    mutationFn: setupSync,
    ...options,
  })
}

export const useUserFlowContext = () => useContext(UserFlowContext)

export const useMainContext = () => useContext(Context)

export const useContexts = () => {
  const mainContext = useContext(Context)
  const userFlowContext = useContext(UserFlowContext)
  return { ...mainContext, ...userFlowContext }
}
