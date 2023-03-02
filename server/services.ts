import { createClient } from "@supabase/supabase-js"
import { config as dotenv } from "dotenv"
import { Database } from "./supabase"
import { App } from "@slack/bolt"
import express from "express"
import path from "path"

if (process.env.NODE_ENV !== "production")
  dotenv({
    path: path.join(__dirname, "..", "..", ".env"),
  })

if (!process.env.SLACK_BOT_TOKEN) throw new Error("Missing SLACK_BOT_TOKEN")
if (!process.env.SLACK_SIGNING_SECRET) throw new Error("Missing SLACK_SIGNING_SECRET")
if (!process.env.SLACK_APP_TOKEN) throw new Error("Missing SLACK_APP_TOKEN")
if (!process.env.SUPABASE_URL) throw new Error("Missing SUPABASE_URL")
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SECRET_KEY || ""
if (!supabaseKey) throw new Error("Missing SUPABASE_KEY || SUPABASE_SECRET_KEY")

export const supabase = createClient<Database>(process.env.SUPABASE_URL, supabaseKey)

export const slack = new App({
  socketMode: true,
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  appToken: process.env.SLACK_APP_TOKEN,
})

export const server = express()
