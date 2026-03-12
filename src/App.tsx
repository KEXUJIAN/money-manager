import { lazy, Suspense } from "react"
import { BrowserRouter, Route, Routes } from "react-router-dom"
import AppLayout from "@/layouts/AppLayout"
import { Toaster } from "@/components/ui/sonner"

const Home = lazy(() => import("@/routes/home"))
const Stats = lazy(() => import("@/routes/stats"))
const Settings = lazy(() => import("@/routes/settings"))
const DevDbPage = lazy(() => import("@/routes/dev-db"))

function App() {
  return (
    <>
      <BrowserRouter>
        <Suspense>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Home />} />
              <Route path="stats" element={<Stats />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            <Route path="/dev-db" element={<DevDbPage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
      <Toaster />
    </>
  )
}

export default App

