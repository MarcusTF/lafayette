import cors from "cors"
import e from "express"

import syncShortcut from "./webhook.supabase.sync-shortcut.controller"

const router = e.Router()

router.post(
  "/",
  cors({
    origin: /^.*\.?supabase\.com?(\/.*)?$/,
  }),
  syncShortcut.post
)

export default ["/sync-shortcut", router] as const
