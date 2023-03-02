import cors from "cors"
import express from "express"
import path from "path"

import { corsOptions, port, port2 } from "./constants"
import { fetchMembers, members } from "./utils"
import { server, slack } from "./services"
import router from "./routes/routes"

fetchMembers()

setInterval(
  async () => {
    await fetchMembers()
    console.log("Fetched Shortcut members")
  },
  1000 * 60 * 5,
  members
)

server
  .use(express.json())
  .use(express.static(path.join(__dirname, "public")))
  .use(cors(corsOptions))
  .use("/api", router)
  .use(async (req, res, next) => {
    res.sendFile(path.join(__dirname, "/public/index.html"))
  })
  .listen(port, () => {
    console.log("Server is running on port " + port + "!")
  })

slack.start(port2 || port + 1).then(() => {
  console.log("⚡️ Bolt app is running on port " + (port2 || port + 1) + "!")
})
