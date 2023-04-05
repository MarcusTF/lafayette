import { RequestHandler } from "express"
import path from "path"

export const serveView: RequestHandler = async (req, res, next) => {
  if (req.path.includes("#access_token")) return res.sendFile(path.join(__dirname, "/public", "/index.html"))
  if (req.path === "/") return res.sendFile(path.join(__dirname, "/public", "/index.html"))
  res.sendFile(path.join(__dirname, "/public", req.path))
}
