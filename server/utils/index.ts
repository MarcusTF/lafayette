import axios from "axios"

import {
  Database,
  Mention,
  ShortcutMember,
  ShortcutWebhookBody,
  SlackIdentityData,
  SupabaseDatabase,
  WorkspaceRes,
} from "types"
import { User } from "@supabase/supabase-js"
import { Workspace } from "routes/api/webhook/shortcut/webhook.shortcut.controller.types"

const quips = [
  "Treat Please! 🦴",
  "I think it's time for belly rubs, you're not busy, right? 🐾",
  "I can confirm there is no squeaky inside of this one.",
  "Okay, now you throw it, and I'll go get it again! 🎾",
  "*_chases tail_*",
  "You're welcome! Now if you'll excuse me, I think I saw a cat on the way over here, and I need to go investigate. 🔎",
  "These are not nearly as crinkly as I was hoping.",
  "Why do you even want me to bring you these, they don't even squeak or anything. 🙄",
  "I'm not leaving until I get some pets, so...",
]

export function getQuip() {
  return quips[Math.floor(Math.random() * quips.length)]
}
