import { Describe, array, boolean, nullable, object, optional, string, type } from "superstruct"
import type { ShortcutMember, ShortcutResponse } from "./types"

export const DisplayIconStruct = type({
  created_at: string(),
  entity_type: string(),
  id: string(),
  updated_at: string(),
  url: string(),
})

export const ProfileStruct = type({
  deactivated: boolean(),
  display_icon: nullable(DisplayIconStruct),
  email_address: string(),
  entity_type: string(),
  gravatar_hash: nullable(string()),
  id: string(),
  is_owner: boolean(),
  mention_name: string(),
  name: string(),
  two_factor_auth_activated: optional(nullable(boolean())),
})

export const ShortcutMemberStruct: Describe<ShortcutMember> = type({
  created_at: string(),
  disabled: boolean(),
  entity_type: string(),
  group_ids: array(string()),
  id: string(),
  profile: ProfileStruct,
  role: string(),
  state: string(),
  updated_at: string(),
})

export const ShortcutResponseStruct: Describe<ShortcutResponse> = array(
  type({
    workspace: object({
      id: string(),
      name: string(),
    }),
    bestGuess: nullable(ShortcutMemberStruct),
    members: array(ShortcutMemberStruct),
  })
)
