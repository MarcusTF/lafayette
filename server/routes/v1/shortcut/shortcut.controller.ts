import { fetchShortcutMembers, updateShortcutUsers } from "services/shortcut.service"
import { RequestHandler } from "express"
import supabase from "services/supabase.service"

const get: RequestHandler = async (req, res) => {
  if (!req.headers.authorization) return void res.status(401).send("Unauthorized")
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(req.headers.authorization)
    if (!user) return void res.status(401).send("Unauthorized")
    if (userError) return void res.status(userError?.status || 401).json(userError?.message || "Unauthorized")

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
          workspace: {
            id: workspace.id,
            name: workspace.name,
          },
          bestGuess: members.find(member => member.profile.email_address === user.email) || null,
          members: members.filter(member => member.profile.email_address),
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
