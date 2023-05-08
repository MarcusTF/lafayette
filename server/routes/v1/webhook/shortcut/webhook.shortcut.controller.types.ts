export type Workspace = {
  created_at: string | null
  id: string
  name: string
  token: string
  shortcut_users: {
    id: string
    user: string | null
    slack_user: {
      active: boolean
      id: string
      user: string | null
    } | null
  }[]
}
