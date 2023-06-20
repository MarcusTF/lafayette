import cors from "cors"
import express from "express"
import rateLimit from "express-rate-limit"
import helmet from "helmet"
import morgan from "morgan"
import path from "path"
import routes from "routes/routes"

import { updateShortcutUsers } from "services/shortcut.service"

import { corsOptions, helmetOptions, port, rateLimitOptions } from "./constants"

if (process.env.NODE_ENV !== "production")
  require("dotenv").config({
    path: path.join(__dirname, "..", "..", "backend.env"),
  })

updateShortcutUsers()

// deepcode ignore UseCsurfForExpress: The CSRF protection library has been deprecated by the Express team
export const server = express()

server
  .use(helmet(helmetOptions))
  .use(rateLimit(rateLimitOptions))
  .use(express.json())
  .use(cors(corsOptions))
  .use(morgan("dev"))
  .get("/yougood", (_, res) => res.status(200).send("Yeah, man, I'm good!"))
  .use(...routes)
  .listen(port, () => {
    console.log("Server is running on port " + port + "!")
  })
