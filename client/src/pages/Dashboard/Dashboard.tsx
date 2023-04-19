import { createContext, useState } from "react"

import {
  LoadingDispatchSetState,
  UserFlowContextType,
  UserFlowDispatchSetState,
  UserFlowRoutes,
} from "./Dashboard.types"
import { Loader, SlackIcon, UserFlow } from "components"
import { ShortcutResponseStruct } from "utilities/guards"
import { SlackIcon as SlackLogo } from "assets"
import { errorToast } from "utilities/toasts"
import { useGetShortcutIds, useGetSlackUserSupabase, useMainContext } from "utilities/hooks"

import "./Dashboard.scss"

export const UserFlowContext = createContext<UserFlowContextType>({
  loading: false,
  route: "allSet",
  setLoading: ((_loading: boolean) => {}) as LoadingDispatchSetState,
  setRoute: ((_route: UserFlowRoutes) => {}) as UserFlowDispatchSetState,
  shortcut: undefined,
})

const Dashboard = () => {
  const [route, setRoute] = useState<UserFlowRoutes>("")
  const [loading, setLoading] = useState<boolean>(false)

  const { user } = useMainContext()

  const supabaseSlack = useGetSlackUserSupabase({
    onSuccess: data => {
      if (data?.active) setRoute("alreadySet")
    },
    retry(failureCount, error) {
      if (error && typeof error === "object" && "code" in error && error.code === "PGRST116") return false
      return failureCount < 3
    },
    onError: () => {
      errorToast("Uh oh! Something went wrong fetching data from the server.", "supabaseSlack.error")
    },
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  })

  const shortcut = useGetShortcutIds({
    enabled:
      (supabaseSlack.isSuccess && !supabaseSlack?.data?.active && !supabaseSlack.isLoading) || supabaseSlack.isError,
    onSuccess: data => {
      if (!ShortcutResponseStruct.is(data)) {
        errorToast("The server returned an unexpected response.", "error.server")
        setRoute("error")
        try {
          ShortcutResponseStruct.assert(data)
        } catch (e) {
          console.error(e)
        }
      }
      if (
        data.every(
          ({ bestGuess }) =>
            !bestGuess?.profile?.mention_name || !bestGuess?.profile?.email_address || !bestGuess?.profile?.name
        )
      )
        setRoute("notFound")
      else setRoute("found")
    },
  })

  const error = shortcut.error

  const avatar = user?.identities?.[0].identity_data?.avatar_url
  return (
    <div className='dashboard'>
      <header className='dashboard__header'>
        <div className='avatar-wrapper'>
          <img src={avatar || SlackLogo} alt='User Avatar' className='user__avatar' />
          {avatar && <SlackIcon />}
        </div>
        <div className='user'>
          <p className='user__name'>{user?.identities?.[0]?.identity_data?.name}</p>
          <p className='user__email'>{user?.identities?.[0]?.identity_data?.email}</p>
        </div>
      </header>
      <main className='dashboard__main'>
        <Loader
          text='Fetching...'
          loading={supabaseSlack.isLoading || (shortcut.fetchStatus !== "idle" && shortcut.isLoading) || loading}
        >
          <UserFlowContext.Provider value={{ route, setRoute, shortcut, loading, setLoading }}>
            <UserFlow route={error ? "error" : route} />
          </UserFlowContext.Provider>
        </Loader>
      </main>
    </div>
  )
}

export default Dashboard
