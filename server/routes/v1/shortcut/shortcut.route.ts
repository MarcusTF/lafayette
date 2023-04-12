import e from "express"
import shortcut from "./shortcut.controller"

const router = e.Router()

router.get("/", shortcut.get)

export default ["/shortcut", router] as const
