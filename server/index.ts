import cors from "cors"
import express from "express"
import path from "path"

if (process.env.NODE_ENV !== "production") require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env") })

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
  .use(serveView)
  .listen(port, () => {
    console.log("Server is running on port " + port + "!")
    console.log(...routes.map(route => route.toString()))
  })
