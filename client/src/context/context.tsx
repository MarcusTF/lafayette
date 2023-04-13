import { FC, PropsWithChildren, createContext, useState } from "react"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createClient } from "@supabase/supabase-js"
import { AppUser } from "../utilities/utils"
import { Database } from "../supabase"
import { MainContext, SelectedShortcut } from "./context.types"

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
export const queryClient = new QueryClient()
export const Context = createContext<MainContext>({} as any)

const ContextProvider: FC<PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null)
  const [selectedShortcut, setSelectedShortcut] = useState<SelectedShortcut>(null)
  return (
    <QueryClientProvider client={queryClient}>
      <Context.Provider value={{ user, setUser, selectedShortcut, setSelectedShortcut }}>{children}</Context.Provider>
    </QueryClientProvider>
  )
}

export default ContextProvider
