import { UseQueryResult } from "@tanstack/react-query"
import { ShortcutResponse } from "../../utilities/types"
import { Dispatch, SetStateAction } from "react"

export type UserFlowRoutes =
  | "error"
  | "allSet"
  | "alreadySet"
  | "confirm"
  | "found"
  | "notFound"
  | "wrongGuess"
  | "notFound"
  | ""

export type UserFlowDispatchSetState = Dispatch<SetStateAction<UserFlowRoutes>>

export type LoadingDispatchSetState = Dispatch<SetStateAction<boolean>>

export type UserFlowContextType = {
  route: UserFlowRoutes
  setRoute: UserFlowDispatchSetState
  shortcut: UseQueryResult<ShortcutResponse> | undefined
  loading: boolean
  setLoading: LoadingDispatchSetState
}
