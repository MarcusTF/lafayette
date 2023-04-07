export interface ShortcutMember {
  created_at: string
  disabled: boolean
  entity_type: string
  group_ids: string[]
  id: string
  profile: Profile
  role: string
  state: string
  updated_at: string
}

export interface Profile {
  deactivated: boolean
  display_icon: DisplayIcon | null
  email_address: string
  entity_type: string
  gravatar_hash: string | null
  id: string
  is_owner: boolean
  mention_name: string
  name: string
  two_factor_auth_activated?: boolean | null
}

interface DisplayIcon {
  created_at: string
  entity_type: string
  id: string
  updated_at: string
  url: string
}

export type ShortcutResponse = {
  workspace: {
    id: string
    name: string
  }
  bestGuess: ShortcutMember | null
  members: ShortcutMember[]
}[]
