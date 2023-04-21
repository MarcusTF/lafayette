import e from "express"
import cors from "cors"
import chat from "./chat.controller"

const router = e.Router()

router.post(
  "/",
  cors({
    origin: "ai.fluffbot.com",
  }),
  chat.post
)

export default ["/chat", router] as const
