import { FC } from "react"

import { AllSet, AlreadySet, Confirm, DashboardTypes, Found, NotFound, WrongGuess } from "pages"
import Error from "pages/Error/Error"

type Props = {
  route: DashboardTypes.UserFlowRoutes
}

const flowSwitch = (route: DashboardTypes.UserFlowRoutes) => {
  switch (route) {
    case "allSet":
      return <AllSet />
    case "alreadySet":
      return <AlreadySet />
    case "confirm":
      return <Confirm />
    case "found":
      return <Found />
    case "notFound":
      return <NotFound />
    case "wrongGuess":
      return <WrongGuess />
    case "error":
      return <Error />
    default:
      return <div></div>
  }
}

const UserFlow: FC<Props> = ({ route }) => {
  return flowSwitch(route)
}

export default UserFlow
