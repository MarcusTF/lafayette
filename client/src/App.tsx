import { Route, Routes } from "react-router-dom"
import Modal from "react-modal"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

import Dashboard from "./pages/Dashboard/Dashboard"
import Login from "./pages/Login/Login"
import PrivateRoute from "./utilities/PrivateRoute"
import { useGetSession, useWatchAuthChanges } from "./utilities/hooks"

import "./App.scss"
import { getDomainParts } from "utilities/utils"

Modal.setAppElement("#root")

const {
  subdomains: [subdomain],
} = getDomainParts()

function App() {
  useGetSession()
  useWatchAuthChanges()

  return (
    <div className='App'>
      {subdomain === "chat" ? (
        <Routes>
          <Route path='/login' element={<PrivateRoute inverse />}>
            <Route path='' element={<Login mode={"chatbot"} />} />
          </Route>
          <Route path='/' element={<PrivateRoute />}>
            <Route path='' element={<>:)</>} />
          </Route>
        </Routes>
      ) : (
        <Routes>
          <Route path='/login' element={<PrivateRoute inverse />}>
            <Route path='' element={<Login mode={"main"} />} />
          </Route>
          <Route path='/' element={<PrivateRoute />}>
            <Route path='' element={<Dashboard />} />
          </Route>
        </Routes>
      )}
      <ToastContainer />
    </div>
  )
}

export default App
