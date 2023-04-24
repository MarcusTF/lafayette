import { Route, Routes } from "react-router-dom"
import { ToastContainer } from "react-toastify"
import Modal from "react-modal"

import { Login, Chat, Dashboard } from "pages"
import { getDomainParts } from "utilities/utils"
import { useGetSession, useWatchAuthChanges } from "utilities/hooks"
import PrivateRoute from "utilities/PrivateRoute"

import "./App.scss"
import "react-toastify/dist/ReactToastify.css"

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
            <Route path='' element={<Chat />} />
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
