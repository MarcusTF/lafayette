import { MutationFunction, UseMutationOptions, UseQueryOptions, useMutation, useQuery } from "@tanstack/react-query"
import { PostgrestError } from "@supabase/supabase-js"
import { SSE } from "sse.js"
import { useCallback, useContext, useEffect, useMemo, useState } from "react"
import { useImmer, Updater } from "use-immer"
import axios from "axios"

import { AppUser, getDomainParts, parseSession } from "./utils"
import { ChatState, Message } from "./hooks.types"
import { Context, supabase } from "context/context"
import { Database } from "supabase"
import { SetupSyncMutation, SetupSyncVariables } from "pages/Confirm/Confirm.types"
import { ShortcutResponse } from "./types"
import { UserFlowContext } from "pages"
import { errorToast } from "./toasts"
import Color from "color"

type SlackUser = Database["public"]["Tables"]["slack_user"]["Row"]
type Workspace = Database["public"]["Tables"]["shortcut_workspaces"]["Row"]
type WorkspaceInsert = Database["public"]["Tables"]["shortcut_workspaces"]["Insert"]
type ShortcutInsert = Database["public"]["Tables"]["shortcut_user"]["Insert"]

export const useGetWorkspaces = (options?: UseQueryOptions<Workspace[]>) => {
  const getWorkspaces = async () => {
    const { data, error, status, statusText } = await supabase.from("shortcut_workspaces").select()
    console.log(status, statusText)
    if (error) throw error
    return data
  }
  return useQuery<Workspace[]>(["workspaces"], getWorkspaces, options)
}

export const useAddNewWorkspace = (options?: UseMutationOptions<"success", PostgrestError, WorkspaceInsert>) => {
  const addNewWorkspace: MutationFunction<"success", WorkspaceInsert> = async (workspace: WorkspaceInsert) => {
    const { error } = await supabase.from("shortcut_workspaces").insert(workspace)
    if (error) throw error
    return "success"
  }
  return useMutation(addNewWorkspace, options)
}

export const useGetUserRole = (options?: UseQueryOptions<boolean>) => {
  const { user } = useContext(Context)
  const getUserRole = async () => {
    const { data, error } = await supabase.from("roles").select("*").eq("user_id", user?.id).single()
    if (error) throw error
    return ["admin", "super-admin"].includes(data?.role || "")
  }
  return useQuery<boolean>(["userRole"], getUserRole, options)
}

export const useGetSlackUserSupabase = (options?: UseQueryOptions<SlackUser>) => {
  const { user } = useContext(Context)
  if (!user) return undefined
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
  const { setUser } = useContexts()

  const getSession = async () => {
    const { data, error } = await supabase.auth.getSession()

    console.log(data, error)

    if (data?.session) {
      const parsed = parseSession(data.session)
      console.log(parsed)
      setUser(parsed)
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
    onError: error => {
      errorToast("Error fetching Session", "error.supabase-session")
      console.error(error)
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
      //@ts-ignore
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

async function upsertShortcutUsers(shortcut_users: ShortcutInsert[]) {
  const { error: error2 } = await supabase.from("shortcut_user").upsert(shortcut_users)
  if (error2) throw error2
}

async function upsertSlack(user: SetupSyncVariables) {
  if (!user.slackId) throw new Error("No slack id")
  if (!user.id) throw new Error("No user id")
  const { error } = await supabase.from("slack_user").upsert({ user: user.id, id: user.slackId }, { onConflict: "id" })
  if (error) throw error
}

const CHAT_URL = `${import.meta.env.VITE_API_URL}/${import.meta.env.VITE_API_VERSION}/chat`

function handleError<T>(error: T, setChatState: Updater<ChatState>) {
  setChatState(chatState => {
    chatState.loading = false
    // chatState.prompt = ""
    chatState.answer = ""
  })
  console.error(error)
  errorToast("Something went wrong!", "error.chat")
}

export const useChat = (user: AppUser | null) => {
  const [chatState, setChatState] = useImmer<ChatState>({
    messages: JSON.parse(localStorage.getItem("messages") || "[]") as Message[],
    loading: false,
    answer: "",
  })

  useEffect(() => {
    if (chatState.messages.length > 0) localStorage.setItem("messages", JSON.stringify(chatState.messages))
  }, [chatState.messages])

  const initiateStream = async (messages: Message[], chatWindow: HTMLDivElement | null) => {
    const eventSource = new SSE(CHAT_URL, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user?.auth?.access_token}`,
      },
      method: "POST",
      payload: JSON.stringify({ messages }),
    })

    eventSource.onopen = () => {
      setChatState(draft => void (draft.loading = true))
      console.log("open")
    }

    eventSource.onerror = event => {
      console.error(event)
      errorToast("Something went wrong!", "error.chat")
      setChatState(draft => void (draft.loading = false))
      eventSource.close()
    }

    eventSource.addEventListener("message", event => {
      if (chatWindow) chatWindow.scroll({ behavior: "smooth", top: chatWindow.scrollHeight })
      try {
        setChatState(draft => void (draft.loading = false))
        if (event.data === "[DONE]") {
          setChatState(chatState => {
            chatState.answer = ""
            chatState.loading = false
          })
          eventSource.close()
          return
        }

        const completionResponse = JSON.parse(event.data)
        const [{ delta }] = completionResponse.choices

        if (delta.content) {
          setChatState(draft => {
            draft.answer = (draft.answer ?? "") + delta.content
            if (draft.messages[draft.messages.length - 1].role === "assistant")
              draft.messages[draft.messages.length - 1].content = draft.answer
            else draft.messages.push({ role: "assistant", content: draft.answer })
          })
        }
      } catch (err) {
        handleError(err, setChatState)
      }
    })

    eventSource.stream()
  }

  return useMemo(() => ({ setChatState, chatState, initiateStream }), [chatState, setChatState, user])
}

export const useFetchSyntaxHighlighter = () => {
  const importSyntaxHighlighter = async () => {
    const { PrismAsync: SyntaxHighlight } = await import("react-syntax-highlighter")
    const { cb: style } = await import("react-syntax-highlighter/dist/cjs/styles/prism")
    return { SyntaxHighlight, style }
  }
  const { data, isLoading, error } = useQuery(["syntaxHighlighter"], importSyntaxHighlighter)
  return { SyntaxHighlight: data?.SyntaxHighlight, style: data?.style, isLoading, error }
}

export const useColorizer = () => {
  const storedColor = Color(localStorage.getItem("color") || "#043763")
  const [h, s, l] = storedColor.hsl().array()
  const [color, setColor] = useImmer({ h, s, l, hsl: `hsl(${h}, ${s}%, ${l}%)`, hex: storedColor.hex() })
  const root = document.documentElement
  useEffect(() => {
    setColor(draft => {
      draft.hsl = `hsl(${draft.h}, ${draft.s}%, ${draft.l}%)`
      draft.hex = Color.hsl(draft.h, draft.s, draft.l).hex()
    })
    root.style.setProperty("--user-color", `hsl(${color.h}, ${color.s}%, ${color.l}%)`)
    root.style.setProperty("--user-color-light", `hsl(${color.h}, ${color.s - 30}%, ${color.l + 15}%)`)
    root.style.setProperty("--user-color-very-light", `hsl(${color.h}, ${color.s - 60}%, ${color.l + 50}%)`)
  }, [color, root])
  return [color, setColor] as const
}
