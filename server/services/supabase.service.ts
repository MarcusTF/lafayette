import { createClient } from "@supabase/supabase-js"

import type { Database } from "types"

if (!process.env.SLACK_SIGNING_SECRET) throw new Error("Missing SLACK_SIGNING_SECRET")
if (!process.env.SUPABASE_URL) throw new Error("Missing SUPABASE_URL")
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SECRET_KEY || ""
if (!supabaseKey) throw new Error("Missing SUPABASE_KEY || SUPABASE_SECRET_KEY")

const supabase = createClient<Database>(process.env.SUPABASE_URL, supabaseKey)

export async function searchSupabaseVectors(vector: number[]) {
  return await supabase.rpc("vector_search", {
    vector,
    entries: 5,
  })
}

export default supabase
