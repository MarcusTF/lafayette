import { FC, PropsWithChildren, createContext, useState } from "react"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { PostgrestError, createClient } from "@supabase/supabase-js"
import { AppUser } from "../utilities/utils"
import { Database } from "../supabase"
import { MainContext, SelectedShortcut } from "./context.types"
import { errorToast } from "utilities/toasts"
import { useImmer } from "use-immer"
import { useChat } from "utilities/hooks"

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
export const queryClient = new QueryClient()
export const Context = createContext<MainContext>({
  user: null,
  setUser: () => {},
  selectedShortcut: null,
  setSelectedShortcut: () => {},
  chat: {
    state: { answer: "", messages: [], loading: false },
    setState: () => {},
    initiateStream: async (x, y) => {
      errorToast("Stream not initialized", "error.stream-not-initialized")
    },
  },
})

const ContextProvider: FC<PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null)
  const { chatState, initiateStream, setChatState } = useChat(user)
  const [selectedShortcut, setSelectedShortcut] = useState<SelectedShortcut>(null)

  return (
    <QueryClientProvider client={queryClient}>
      <Context.Provider
        value={{
          user,
          setUser,
          selectedShortcut,
          setSelectedShortcut,
          chat: {
            state: chatState,
            setState: setChatState,
            initiateStream,
          },
        }}
      >
        {children}
      </Context.Provider>
    </QueryClientProvider>
  )
}

export default ContextProvider
