import { BrowserRouter, Route, Routes } from "react-router-dom"
import AppLayout from "@/layouts/AppLayout"
import Home from "@/routes/home"
import Stats from "@/routes/stats"
import Settings from "@/routes/settings"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Home />} />
          <Route path="stats" element={<Stats />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
