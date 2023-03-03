import { Dispatch, FC, PropsWithChildren, SetStateAction, createContext, useState } from "react"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createClient } from "@supabase/supabase-js"
import { AppUser } from "./utilities/utils"
import { Database } from "./supabase"

type MainContext = { user: AppUser | null; setUser: Dispatch<SetStateAction<AppUser | null>> }

export const supabase = createClient<Database>(import.meta.VITE_SUPABASE_URL, import.meta.VITE_SUPABASE_ANON_KEY)
export const queryClient = new QueryClient()
export const Context = createContext<MainContext>({} as any)

const ContextProvider: FC<PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null)
  return (
    <QueryClientProvider client={queryClient}>
      <Context.Provider value={{ user, setUser }}>{children}</Context.Provider>
    </QueryClientProvider>
  )
}

export default ContextProvider
