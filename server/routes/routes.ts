import e from "express"

import v2Routes from "./v2/v2.routes"
import v1Routes from "./v1/v1.routes"

const routes = e.Router()

routes.use(...v2Routes)
routes.use(...v1Routes)

export default ["/", routes] as const
