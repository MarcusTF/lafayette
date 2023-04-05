import { Describe, array, boolean, nullable, object, string } from "superstruct"
import { Workspace } from "./webhook.shortcut.controller.types"

export const WorkspaceStruct: Describe<Workspace> = object({
  created_at: nullable(string()),
  id: string(),
  name: string(),
  token: string(),
  shortcut_users: array(
    object({
      id: string(),
      user: nullable(string()),
      slack_user: nullable(
        object({
          active: boolean(),
          id: string(),
          user: nullable(string()),
        })
      ),
    })
  ),
})
