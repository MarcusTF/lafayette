import { CorsOptions } from "cors"
import { stringNumber } from "types"
import { Options as RLOptions } from "express-rate-limit"
import { HelmetOptions } from "helmet"

export const port = stringNumber(process.env.PORT) || 3000
export const port2 = stringNumber(process.env.PORT2) || 3001

export const corsOptions: CorsOptions = {
  origin: process.env.APP_URL,
  optionsSuccessStatus: 200,
}

export const rateLimitOptions: Partial<RLOptions> = {
  windowMs: 15 * 60 * 1000,
  max: 100,
}

export const helmetOptions = {} as HelmetOptions
