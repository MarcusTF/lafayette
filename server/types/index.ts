export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      shortcut_user: {
        Row: {
          id: string
          slack_id: string | null
          user: string | null
          workspace: string
        }
        Insert: {
          id: string
          slack_id?: string | null
          user?: string | null
          workspace: string
        }
        Update: {
          id?: string
          slack_id?: string | null
          user?: string | null
          workspace?: string
        }
      }
      shortcut_workspaces: {
        Row: {
          created_at: string | null
          id: string
          name: string
          token: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          token: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          token?: string
        }
      }
      slack_user: {
        Row: {
          active: boolean
          id: string
          user: string | null
        }
        Insert: {
          active?: boolean
          id: string
          user?: string | null
        }
        Update: {
          active?: boolean
          id?: string
          user?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export namespace SupabaseDatabase {
  export type shortcut_user = Database["public"]["Tables"]["shortcut_user"]["Row"]
  export type shortcut_user_Insert = Database["public"]["Tables"]["shortcut_user"]["Insert"]
  export type shortcut_user_Update = Database["public"]["Tables"]["shortcut_user"]["Update"]
  export type shortcut_workspaces = Database["public"]["Tables"]["shortcut_workspaces"]["Row"]
  export type shortcut_workspaces_Insert = Database["public"]["Tables"]["shortcut_workspaces"]["Insert"]
  export type shortcut_workspaces_Update = Database["public"]["Tables"]["shortcut_workspaces"]["Update"]
  export type slack_user = Database["public"]["Tables"]["slack_user"]["Row"]
  export type slack_user_Insert = Database["public"]["Tables"]["slack_user"]["Insert"]
  export type slack_user_Update = Database["public"]["Tables"]["slack_user"]["Update"]
}

export interface ShortcutWebhookBody {
  id: string
  changed_at: string
  primary_id: number
  member_id: string
  version: string
  actions: Action[]
  references?: Reference[]
}

interface Reference {
  id: number
  entity_type: string
  name: string
}

export interface Action<T extends string | "story-comment" = string> {
  id: number
  entity_type: T
  action: string
  name?: string
  mention_ids?: string[]
  changes?: Changes
  author_id?: string
  app_url?: string
  text?: string
}

interface Changes {
  started?: Started
  workflow_state_id?: WorkflowStateId
  owner_ids?: OwnerIds
  text?: string
}

interface OwnerIds {
  adds: string[]
}

interface WorkflowStateId {
  new: number
  old: number
}

interface Started {
  new: boolean
  old: boolean
}

export const stringNumber = (value: unknown): number | undefined => {
  if (value === undefined) return undefined
  const number = Number(value)
  if (Number.isNaN(number)) return undefined
  return number
}

export type WRSlackUser = {
  active: boolean
  id: string
  user: string | null
} | null

export type WRShortcutUser =
  | {
      id: string
      user: string | null
      slack_user: WRSlackUser
    }[]
  | null

export interface WorkspaceRes {
  id: string
  token: string
  shortcut_users: WRShortcutUser
}

export type Mention = {
  id: string
  name: string
  text: string
  appUrl: string
  authorId: string
  workspace: {
    id: string
    name: string
  }
  slackUser: WRSlackUser
  shortcutUser: NonNullable<WRShortcutUser>[0]
  author: string
}

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

interface Profile {
  deactivated: boolean
  display_icon: DisplayIcon
  email_address: string
  entity_type: string
  gravatar_hash: string
  id: string
  is_owner: boolean
  mention_name: string
  name: string
  two_factor_auth_activated: boolean
}

interface DisplayIcon {
  created_at: string
  entity_type: string
  id: string
  updated_at: string
  url: string
}
export interface SlackIdentityData {
  iss: string
  sub: string
  name: string
  email: string
  picture: string
  full_name: string
  avatar_url: string
  provider_id: string
  custom_claims: {
    "https://slack.com/team_id": string
  }
  email_verified: boolean
}
