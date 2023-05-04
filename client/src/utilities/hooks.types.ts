export type Message = {
  content: string
  role: "system" | "user" | "assistant"
  name?: string | undefined
}

export type ChatState = {
  messages: Message[]
  loading: boolean
  answer: string
}
