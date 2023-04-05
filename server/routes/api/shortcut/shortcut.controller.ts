import { fetchShortcutMembers } from "services/shortcut.service"
import { RequestHandler } from "express"
import supabase from "services/supabase.service"

const get: RequestHandler = async (req, res) => {
  if (!req.headers.authorization) return void res.status(401).send("Unauthorized")
  try {
    const { data, error } = await supabase.auth.getUser(req.headers.authorization)
    const { user } = data
    if (!user) return void res.status(401).send("Unauthorized")
    if (error) return void res.status(error?.status || 401).send(error?.message || "Unauthorized")

    const { data: workspaceData, error: workspaceError } = await supabase
      .from("shortcut_workspaces")
      .select(`*, shortcut_users:shortcut_user(id, user, slack_user(*))`)

    if (workspaceError) return void res.status(500).send("Internal Server Error")
    if (!workspaceData?.length) return void res.status(404).send("No workspaces found")

    const shortcutWorkspaceMembers = await Promise.all(
      workspaceData.map(async workspace => {
        const { token } = workspace
        const { data: members } = await fetchShortcutMembers(token)

        return {
          bestGuess: members.find(member => member.profile.email_address === user.email) || null,
          members,
        }
      })
    )

    res.status(200).json(shortcutWorkspaceMembers)
  } catch (error) {
    console.log(error)
    res.status(500).send("Internal Server Error")
  }
}

export default { get }
