import e from "express"

import v1Routes from "./v1/v1.routes"

const routes = e.Router()

routes.use(...v1Routes)

export default ["/", routes] as const
