import { Profile } from "utilities/types"

export interface Match {
  workspace: {
    id: string
    name: string
  }
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
