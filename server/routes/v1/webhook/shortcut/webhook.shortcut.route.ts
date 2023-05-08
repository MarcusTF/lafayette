import cors from "cors"
import e from "express"

import webhookShortcut from "./webhook.shortcut.controller"

const router = e.Router()

router.post(
  "/",
  cors({
    origin: /^.*\.?shortcut\.com(\/.*)?$/,
  }),
  webhookShortcut.post
)

export default ["/shortcut", router] as const
