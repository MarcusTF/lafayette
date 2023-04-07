import { config as dotenv } from "dotenv"
import cors from "cors"
import express from "express"
import path from "path"

if (process.env.NODE_ENV !== "production") dotenv({ path: path.join(__dirname, "..", "..", ".env") })

import { corsOptions, port } from "./constants"
import { serveView } from "./routes/view/view"
import routes from "./routes/api/api.routes"
import { updateShortcutUsers } from "services/shortcut.service"
import morgan from "morgan"

updateShortcutUsers()

export const server = express()

server
  .use(express.json())
  .use(express.static(path.join(__dirname, "public")))
  .use(cors(corsOptions))
  .use(morgan("dev"))
  .use(...routes)
  .use("/assets", express.static(path.join(__dirname, "public", "assets"), { index: false }))
  .use("/favicon.svg", express.static(path.join(__dirname, "public", "favicon.svg"), { index: false }))
  .use("/*", express.static(path.join(__dirname, "public")))
  .listen(port, () => {
    console.log("Server is running on port " + port + "!")
    console.log(...routes.map(route => route.toString()))
  })
