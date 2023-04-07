import { Match } from "pages/NotFound/NotFound.types"
import { Dispatch, SetStateAction } from "react"
import { ShortcutMember } from "utilities/types"
import { AppUser } from "utilities/utils"

export type SelectedShortcut =
  | {
      id?: string
      workspace: string
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
}
