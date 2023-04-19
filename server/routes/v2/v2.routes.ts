import e from "express"
import chat from "./chat/chat.route"
// import webhook from "./webhook/webhook.route"

const routes = e.Router()

// routes.use(...webhook)
routes.use(...chat)

export default ["/v2", routes] as const
