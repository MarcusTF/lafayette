import { ChatCompletionRequestMessage } from "openai"
import { array, boolean, Describe, enums, literal, nullable, number, object, optional, string, type } from "superstruct"

import type {
  Action,
  Mention,
  ShortcutMember,
  ShortcutWebhookBody,
  WorkspaceRes,
  WRShortcutUser,
  WRSlackUser,
} from "types"

const SlackUserStruct: Describe<WRSlackUser> = nullable(
  object({
    active: boolean(),
    id: string(),
    user: nullable(string()),
  })
)

const ShortcutUserStructSingle: Describe<NonNullable<WRShortcutUser>[0]> = object({
  id: string(),
  user: nullable(string()),
  slack_user: SlackUserStruct,
})

const ShortcutUserStruct: Describe<WRShortcutUser> = nullable(array(ShortcutUserStructSingle))

export const WorkspaceResStruct: Describe<WorkspaceRes[]> = array(
  object({
    id: string(),
    token: string(),
    shortcut_users: ShortcutUserStruct,
  })
)

export const StartedStruct = type({
  new: boolean(),
  old: boolean(),
})

export const WorkflowStateIdStruct = type({
  new: number(),
  old: number(),
})

export const OwnerIdsStruct = type({
  adds: array(string()),
})

export const ChangesStruct = type({
  started: optional(StartedStruct),
  workflow_state_id: optional(WorkflowStateIdStruct),
  owner_ids: optional(OwnerIdsStruct),
  text: optional(string()),
})

export const ActionStruct: Describe<Action> = type({
  id: number(),
  entity_type: string(),
  action: string(),
  name: optional(string()),
  mention_ids: optional(array(string())),
  changes: optional(ChangesStruct),
  author_id: optional(string()),
  app_url: optional(string()),
  text: optional(string()),
})

export const StoryActionStruct: Describe<Action<"story-comment">> = type({
  id: number(),
  entity_type: literal("story-comment"),
  action: string(),
  name: optional(string()),
  mention_ids: optional(array(string())),
  changes: optional(ChangesStruct),
  author_id: optional(string()),
  app_url: optional(string()),
  text: optional(string()),
})

export const ReferenceStruct = type({
  id: number(),
  entity_type: string(),
  name: string(),
})

export const ShortcutWebhookBodyStruct: Describe<ShortcutWebhookBody> = type({
  id: string(),
  changed_at: string(),
  primary_id: number(),
  member_id: string(),
  version: string(),
  actions: array(ActionStruct),
  references: optional(array(ReferenceStruct)),
})

export const isShortcutWebhookBody = (data: unknown): data is ShortcutWebhookBody => ShortcutWebhookBodyStruct.is(data)

export const DisplayIconStruct = type({
  created_at: string(),
  entity_type: string(),
  id: string(),
  updated_at: string(),
  url: string(),
})

export const ProfileStruct = type({
  deactivated: boolean(),
  display_icon: nullable(DisplayIconStruct),
  email_address: string(),
  entity_type: string(),
  gravatar_hash: string(),
  id: string(),
  is_owner: boolean(),
  mention_name: string(),
  name: string(),
  two_factor_auth_activated: boolean(),
})

export const ShortcutMemberStruct = type({
  created_at: string(),
  disabled: boolean(),
  entity_type: string(),
  group_ids: array(string()),
  id: string(),
  profile: ProfileStruct,
  role: string(),
  state: string(),
  updated_at: string(),
})

export const isShortcutMember = (data: unknown): data is ShortcutMember => ShortcutMemberStruct.is(data)
export const isShortcutMemberArray = (data: unknown): data is ShortcutMember[] => array(ShortcutMemberStruct).is(data)

export const MentionStruct: Describe<Mention> = type({
  id: string(),
  name: string(),
  text: string(),
  appUrl: string(),
  authorId: string(),
  workspace: object({
    id: string(),
    name: string(),
  }),
  slackUser: SlackUserStruct,
  shortcutUser: ShortcutUserStructSingle,
  author: string(),
})

export const OpenAIMessageStruct: Describe<ChatCompletionRequestMessage> = type({
  role: enums(["user", "system", "assistant"]),
  content: string(),
  name: optional(string()),
})
