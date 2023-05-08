import e from "express"

import syncShortcut from "./sync-shortcut/webhook.supabase.sync-shortcut.route"

const router = e.Router()

router.use(...syncShortcut)

export default ["/supabase", router] as const
