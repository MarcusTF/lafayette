import e from "express"

import shortcut from "./shortcut/webhook.shortcut.route"
import supabase from "./supabase/webhook.supabase.route"

const router = e.Router()

router.use(...shortcut)
router.use(...supabase)

export default ["/webhooks", router] as const
