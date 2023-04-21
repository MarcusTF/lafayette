import e from "express"
import cors from "cors"
import chat from "./chat.controller"

const router = e.Router()

router.post(
  "/",
  cors({
    origin: `chat.${process.env.APP_URL?.split("://")[1]}`,
  }),
  chat.post
)

export default ["/chat", router] as const
