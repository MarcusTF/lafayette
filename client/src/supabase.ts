export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      shortcut_user: {
        Row: {
          id: string
          slack_id: string | null
          user: string | null
        }
        Insert: {
          id: string
          slack_id?: string | null
          user?: string | null
        }
        Update: {
          id?: string
          slack_id?: string | null
          user?: string | null
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
