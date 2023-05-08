export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]
declare global {
  interface SupabaseDB {
    public: {
      Tables: {
        nc_evolutions: {
          Row: {
            batch: number | null
            checksum: string | null
            created: string | null
            created_at: string | null
            description: string | null
            id: number
            status: number | null
            title: string
            titleDown: string | null
            updated_at: string | null
          }
          Insert: {
            batch?: number | null
            checksum?: string | null
            created?: string | null
            created_at?: string | null
            description?: string | null
            id?: number
            status?: number | null
            title: string
            titleDown?: string | null
            updated_at?: string | null
          }
          Update: {
            batch?: number | null
            checksum?: string | null
            created?: string | null
            created_at?: string | null
            description?: string | null
            id?: number
            status?: number | null
            title?: string
            titleDown?: string | null
            updated_at?: string | null
          }
        }
        roles: {
          Row: {
            id: string
            role: string | null
            user_id: string | null
          }
          Insert: {
            id?: string
            role?: string | null
            user_id?: string | null
          }
          Update: {
            id?: string
            role?: string | null
            user_id?: string | null
          }
        }
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
}
