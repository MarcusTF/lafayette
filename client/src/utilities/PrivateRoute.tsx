import { FC, PropsWithChildren, useContext } from "react"
import { Navigate, Outlet } from "react-router-dom"

import { Context } from "context/context"

type Props = {
  inverse?: boolean
}

const PrivateRoute: FC<PropsWithChildren<Props>> = ({ inverse }) => {
  const { user } = useContext(Context)
  if (inverse) if (user) return <Navigate to='/' replace />
  if (!inverse) if (!user) return <Navigate to='/login' replace />
  return <Outlet />
}

export default PrivateRoute
