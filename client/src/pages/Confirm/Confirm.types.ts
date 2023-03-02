import { MutationFunction } from "@tanstack/react-query"

export type SetupSyncVariables = {
  shortcutId: string
  slackId: string
  userId: string
}

export type SetupSyncMutation = MutationFunction<null, SetupSyncVariables>
