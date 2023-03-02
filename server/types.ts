export interface ShortcutWebhookBody {
  id: string
  changed_at: string
  primary_id: number
  member_id: string
  version: string
  actions: Action[]
  references?: Reference[]
}

export interface Reference {
  id: number
  entity_type: string
  name: string
}

export interface Action {
  id: number
  entity_type: string
  action: string
  name?: string
  mention_ids?: string[]
  changes?: Changes
  author_id?: string
  app_url?: string
  text?: string
}

export interface Changes {
  started?: Started
  workflow_state_id?: Workflowstateid
  owner_ids?: Ownerids
  text?: string
}

export interface Ownerids {
  adds: string[]
}

export interface Workflowstateid {
  new: number
  old: number
}

export interface Started {
  new: boolean
  old: boolean
}

export const isShortcutWebhookBody = (body: any): body is ShortcutWebhookBody => {
  return (
    (body &&
      typeof body.id === "string" &&
      typeof body.changed_at === "string" &&
      typeof body.primary_id === "number" &&
      typeof body.member_id === "string" &&
      typeof body.version === "string" &&
      Array.isArray(body.actions) &&
      body.references === undefined) ||
    Array.isArray(body.references)
  )
}

export const stringNumber = (value: string | undefined): number | undefined => {
  if (value === undefined) return undefined
  const number = Number(value)
  if (isNaN(number)) return undefined
  return number
}
