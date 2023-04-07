import React from "react"
import ReactDOM from "react-dom/client"

import { BrowserRouter } from "react-router-dom"

import App from "./App"
import ContextProvider from "./context/context"

import "./index.scss"

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <ContextProvider>
        <App />
      </ContextProvider>
    </BrowserRouter>
  </React.StrictMode>
)
