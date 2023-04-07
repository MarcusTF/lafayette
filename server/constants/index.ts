import { CorsOptions } from "cors"
import { stringNumber } from "types"

export const port = stringNumber(process.env.PORT) || 3000
export const port2 = stringNumber(process.env.PORT2) || 3001

export const corsOptions: CorsOptions = {
  origin: [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:5173",
    process.env.APP_URL || "http://localhost:5173",
  ],
  optionsSuccessStatus: 200,
}

export const rateLimitOptions: Partial<RLOptions> = {
  windowMs: 15 * 60 * 1000,
  max: 100,
}

export const helmetOptions = {
  xssFilter: true,
} as HelmetOptions
