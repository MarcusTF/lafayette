import e from "express"
import webhookShortcut from "./webhook.shortcut.controller"

const router = e.Router()

router.post("/", webhookShortcut.post)

export default ["/shortcut", router] as const
