import { Dispatch, FC, SetStateAction } from "react"
import { UseMutateFunction, UseQueryResult } from "@tanstack/react-query"

import { ShortcutResponse } from "./types"

export type WorkspacesModalFC = FC<{
  isOpen: boolean
  setIsOpen: Dispatch<SetStateAction<boolean>>
}>

export type ConfirmModalFC = FC<{
  isOpen: boolean
  setIsOpen: Dispatch<SetStateAction<boolean>>
  undoSync: UseMutateFunction
}>

export type ShortcutIdInfoModalFC = FC<{
  shortcut: UseQueryResult<ShortcutResponse> | undefined
  isOpen: boolean
  setIsOpen: Dispatch<SetStateAction<boolean>>
}>

export type ChatOptionsModalFC = FC<{
  isOpen: boolean
  setIsOpen: Dispatch<SetStateAction<boolean>>
}>

export type AddWorkspaceModalFC = FC<{
  isOpen: boolean
  setIsOpen: Dispatch<SetStateAction<boolean>>
}>

export type WorkspaceHelpModalFC = FC<{
  isOpen: boolean
  toggleOpen: () => void
  type: "name" | "token"
}>
