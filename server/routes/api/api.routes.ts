import e from "express"
import shortcut from "./shortcut/shortcut.route"
import webhook from "./webhook/webhook.route"

const routes = e.Router()

routes.use(...webhook)
routes.use(...shortcut)

export default ["/api", routes] as const
