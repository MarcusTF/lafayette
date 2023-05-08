import { FC } from "react"
import { useSearchParams } from "react-router-dom"

import { supabase } from "context/context"

import { Lafayette, SlackIcon } from "assets"
import "./Login.scss"

type Props = {
  mode: "main" | "chatbot"
}

function getRedirectURL(mode: "main" | "chatbot", url?: string): string {
  if (typeof import.meta.env.VITE_APP_URL !== "string") return ""
  const appUrl = url || import.meta.env.VITE_APP_URL,
    appUrlParts = appUrl?.split("://"),
    protocol = appUrlParts?.[0],
    domain = appUrlParts?.[1]?.split("/")?.[0] || appUrlParts?.[1],
    main = `${protocol}://${domain}/login`,
    chatbot = `${protocol}://chat.${domain}/login`

  return mode === "main" ? main : chatbot
}

const getFlavorText = (mode: "main" | "chatbot", name: string) => {
  switch (mode) {
    case "main":
      return {
        title: `Hey there, ${name || "friend"}!`,
        subtitle: "Want to play fetch? I can fetch your shortcut mentions and bring them to you in Slack!",
        thoughts:
          "Ooooh, do they have a squeaky in them? Or that crinkly stuff? I loooove the crinkly stuff! Oh! Right! Sorry…",
      }
    case "chatbot":
      return {
        title: `Hey there, ${name || "friend"}!`,
        subtitle:
          "\"Speak\" takes on a whole new meaning when you're talking to a me! I'm your adorable, fluffy, AI Assistant!",
        thoughts: "Although, I DO looove to bark, so I'll probably do a little bit of that too...",
      }
  }
}

const handleLogin = (mode: Props["mode"]) => {
  supabase.auth.signInWithOAuth({
    provider: "slack",
    options: {
      redirectTo: getRedirectURL(mode),
    },
  })
}

const Login: FC<Props> = ({ mode }) => {
  const [params] = useSearchParams()
  const username = decodeURI(params.get("username") || "friend")
  const firstName = username?.split?.(" ")?.[0]

  const { title, subtitle, thoughts } = getFlavorText(mode, firstName)

  return (
    <div className='login'>
      <header className='login__header'>
        <img alt='Lafayette, the good-est dog that has ever lived' src={Lafayette} className='fluffybutt' />
        <h1 className='header__title'>{title}</h1>
        <p className='header__subtitle'>{subtitle}</p>
        <p className='thoughts'>{thoughts}</p>
      </header>
      <main className='login__main'>
        <p className='main__instructions'>
          Click the button below to log in with your slack account and we can get started!
        </p>
        <button onClick={() => handleLogin(mode)} className='btn btn--slack'>
          <img src={SlackIcon} alt='Slack Logo' className='slack-icon' />
          Sign in with Slack
        </button>
      </main>
    </div>
  )
}

export default Login
