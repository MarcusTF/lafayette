import supabase from "services/supabase.service"

async function getFromSupabase(workspaceNameFromRequest: string) {
  return await supabase
    .from("shortcut_workspaces")
    .select(`*, shortcut_users:shortcut_user(id, user, slack_user(*))`)
    .eq("name", workspaceNameFromRequest)
    .single()
}

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
