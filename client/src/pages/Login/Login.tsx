import { FC } from "react"
import { useSearchParams } from "react-router-dom"

import { supabase } from "context"

import { SlackIcon, Lafayette } from "assets"
import "./Login.scss"

type Props = {}

const Login: FC<Props> = (props: Props) => {
  const [params] = useSearchParams()
  const username = decodeURI(params.get("username") || "friend")
  const firstName = username?.split?.(" ")?.[0]

  return (
    <div className='login'>
      <header className='login__header'>
        <img alt='Lafayette, the good-est dog that has ever lived' src={Lafayette} className='fluffybutt' />
        <h1 className='header__title'>Hey there, {firstName || username}!</h1>
        <p className='header__subtitle'>
          Want to play fetch? I can fetch your shortcut mentions and bring them to you in Slack!
        </p>
        <p className='thoughts'>
          Ooooh, do they have a squeaky in them? Or that crinkly stuff? I loooove the crinkly stuff! Oh! Right! Sorry…
        </p>
      </header>
      <main className='login__main'>
        <p className='main__instructions'>
          Click the button below to log in with your slack account and we can get started!
        </p>
        <button
          onClick={() => {
            supabase.auth.signInWithOAuth({
              provider: "slack",
            })
          }}
          className='btn btn--slack'
        >
          <img src={SlackIcon} alt='Slack Logo' className='slack-icon' />
          Sign in with Slack
        </button>
      </main>
    </div>
  )
}

export default Login
