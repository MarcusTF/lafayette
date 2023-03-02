import { Route, Routes } from "react-router-dom"
import Modal from "react-modal"

import Dashboard from "./pages/Dashboard/Dashboard"
import Login from "./pages/Login/Login"
import PrivateRoute from "./utilities/PrivateRoute"
import { useGetSession, useWatchAuthChanges } from "./utilities/hooks"

import "./App.scss"

Modal.setAppElement("#root")

function App() {
  useGetSession()
  useWatchAuthChanges()

  return (
    <div className='App'>
      <Routes>
        <Route path='/login' element={<PrivateRoute inverse />}>
          <Route path='' element={<Login />} />
        </Route>
        <Route path='/' element={<PrivateRoute />}>
          <Route path='' element={<Dashboard />} />
        </Route>
      </Routes>
    </div>
  )
}

export default App
