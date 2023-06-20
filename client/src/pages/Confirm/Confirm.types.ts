import { MutationFunction } from "@tanstack/react-query"

export type SetupSyncVariables = {
  slackId: string | undefined
  shortcutIds: [string | undefined, string | undefined][] | undefined
  id: string | undefined
}

export type SetupSyncMutation = MutationFunction<void, SetupSyncVariables>
