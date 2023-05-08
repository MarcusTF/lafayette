import cors from "cors"
import e from "express"

import chat from "./chat.controller"

const router = e.Router()

const [protocol, domain] = process.env.APP_URL?.split("://") || ["http", "localhost:" + 5173]

router.post(
  "/",
  cors({
    credentials: true,
    optionsSuccessStatus: 200,
    origin: `${protocol}://chat.${domain}`,
  }),
  chat.post
)

export default ["/chat", router] as const
