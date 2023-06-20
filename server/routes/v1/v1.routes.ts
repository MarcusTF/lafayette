import e from "express"

import chat from "./chat/chat.route"
import shortcut from "./shortcut/shortcut.route"
import webhook from "./webhook/webhook.route"

const routes = e.Router()

routes.use(...webhook)
routes.use(...shortcut)
routes.use(...chat)

export default ["/v1", routes] as const
