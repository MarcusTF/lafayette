import { Session } from "@supabase/supabase-js"

export const parseSession = (session: Session) => ({
  ...session.user,
  auth: {
    access_token: session.access_token,
    expires_at: session.expires_at,
    expires_in: session.expires_in,
    provider_refresh_token: session.provider_refresh_token,
    provider_token: session.provider_token,
    refresh_token: session.refresh_token,
    token_type: session.token_type,
  },
})

export type AppUser = ReturnType<typeof parseSession>
