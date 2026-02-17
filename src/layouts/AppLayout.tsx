import { Link, Outlet, useLocation } from "react-router-dom"
import { Home, PieChart, Settings, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export default function AppLayout() {
    const location = useLocation()

    const navItems = [
        { icon: Home, label: "Home", path: "/" },
        { icon: PieChart, label: "Stats", path: "/stats" },
        { icon: Settings, label: "Settings", path: "/settings" },
    ]

    return (
        <div className="flex h-screen w-full bg-background text-foreground">
            {/* Desktop Sidebar */}
            <div className="hidden md:flex w-64 flex-col border-r p-4 space-y-4">
                <h1 className="text-2xl font-bold px-2 text-primary">Money Manager</h1>
                <nav className="flex-1 space-y-2">
                    {navItems.map((item) => (
                        <Link to={item.path} key={item.path}>
                            <Button
                                variant={location.pathname === item.path ? "secondary" : "ghost"}
                                className="w-full justify-start gap-2"
                            >
                                <item.icon className="h-4 w-4" />
                                {item.label}
                            </Button>
                        </Link>
                    ))}
                </nav>
                <Button className="w-full gap-2">
                    <Plus className="h-4 w-4" /> New Record
                </Button>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <header className="md:hidden h-14 border-b flex items-center px-4 justify-between bg-card z-10">
                    <h1 className="font-semibold">Money Manager</h1>
                    {/* Mobile Header Actions if needed */}
                </header>

                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    <Outlet />
                </main>

                {/* Mobile Bottom Tab Bar */}
                <div className="md:hidden h-16 border-t bg-card flex items-center justify-around px-2 z-10">
                    {navItems.map((item) => (
                        <Link to={item.path} key={item.path} className="flex-1">
                            <div
                                className={cn(
                                    "flex flex-col items-center justify-center h-full space-y-1",
                                    location.pathname === item.path ? "text-primary" : "text-muted-foreground"
                                )}
                            >
                                <item.icon className="h-5 w-5" />
                                <span className="text-xs font-medium">{item.label}</span>
                            </div>
                        </Link>
                    ))}
                    {/* Quick Add Button in Tab Bar Center - customized */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
                        <Button size="icon" className="h-12 w-12 rounded-full shadow-lg">
                            <Plus className="h-6 w-6" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
