export interface ShortcutResponse {
  bestGuess: ShortcutMember
  options: ShortcutMember[]
}

export interface ShortcutMember {
  id: string
  name: string
  mentionName: string
  email: string
}

export interface SlackUser {
  id: string
  user: string | null
  active: boolean
}
