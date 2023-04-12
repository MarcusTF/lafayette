import { RequestHandler } from "express"
import { updateShortcutUsers } from "services/shortcut.service"

const post: RequestHandler = async (_, res) => {
  const [message, options] = await updateShortcutUsers()
  res.status(options.status || 500).send(message || "Internal Server Error")
}

export default {
  post,
}
