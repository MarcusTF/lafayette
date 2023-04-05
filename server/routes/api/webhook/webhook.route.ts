import e from "express"
import shortcut from "./shortcut/webhook.shortcut.route"

const router = e.Router()

router.use(...shortcut)

export default ["/webhooks", router] as const
