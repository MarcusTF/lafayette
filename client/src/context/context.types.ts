import { Dispatch, SetStateAction } from "react"
import { Updater } from "use-immer"

import { ChatState, Message } from "utilities/hooks.types"
import { AppUser } from "utilities/utils"

export type SelectedShortcut =
  | {
      id?: string
      workspace: { name: string; id: string }
      name: string | undefined
      email: string | undefined
      mentionName: string | undefined
    }[]
  | undefined
  | null

export type MainContext = {
  user: AppUser | null
  setUser: Dispatch<SetStateAction<AppUser | null>>
  selectedShortcut: SelectedShortcut
  setSelectedShortcut: Dispatch<SetStateAction<SelectedShortcut>>
  chat: {
    state: ChatState
    setState: Updater<ChatState>
    initiateStream: ((messages: Message[], chatWindow: HTMLDivElement | null) => Promise<void>) | (() => {})
  }
}
