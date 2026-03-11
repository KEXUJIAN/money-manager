import { BrowserRouter, Route, Routes } from "react-router-dom"
import AppLayout from "@/layouts/AppLayout"
import Home from "@/routes/home"
import Stats from "@/routes/stats"
import Settings from "@/routes/settings"
import { Toaster } from "@/components/ui/sonner"

import DevDbPage from "@/routes/dev-db"

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Home />} />
            <Route path="stats" element={<Stats />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="/dev-db" element={<DevDbPage />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </>
  )
}

export default App

