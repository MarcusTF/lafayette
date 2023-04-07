import cors from "cors"
import express from "express"
import helmet, { HelmetOptions } from "helmet"
import path from "path"
import rateLimit from "express-rate-limit"

if (process.env.NODE_ENV !== "production") require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env") })

import { corsOptions, helmetOptions, port, rateLimitOptions } from "./constants"
import { updateShortcutUsers } from "services/shortcut.service"
import morgan from "morgan"
import routes from "./routes/api/api.routes"

updateShortcutUsers()

// deepcode ignore UseCsurfForExpress: The CSRF protection library has been deprecated by the Express team
export const server = express()

server
  .use(helmet(helmetOptions))
  .use(rateLimit(rateLimitOptions))
  .use(express.json())
  .use(cors(corsOptions))
  .use(morgan("dev"))
  .use(...routes)
  .use("/assets", express.static(path.join(__dirname, "public", "assets"), { index: false }))
  .use("/favicon.svg", express.static(path.join(__dirname, "public", "favicon.svg"), { index: false }))
  .use("/*", express.static(path.join(__dirname, "public"), { index: "index.html" }))
  .listen(port, () => {
    console.log("Server is running on port " + port + "!")
    console.log(...routes.map(route => route.toString()))
  })
