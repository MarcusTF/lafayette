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

export const getDomainParts = () => {
  const { hostname } = window.location
  if (hostname.includes("localhost")) {
    return {
      tld: null,
      domain: "localhost",
      subdomains: [hostname.split(".")[0]],
      ...window.location,
    }
  }

  const hostnameArray = hostname.split(".")
  const tldWithPath = hostnameArray.pop()
  const [tld] = tldWithPath?.split("/") || []
  const domain = hostnameArray.pop()
  const subdomains = hostnameArray

  if (subdomains[0] === "www") subdomains.shift()
  return { tld, domain, subdomains, ...window.location }
}

export type AppUser = ReturnType<typeof parseSession>
