import { Link, Outlet, useLocation } from "react-router-dom"
import { Home, PieChart, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

export default function AppLayout() {
    const location = useLocation()

    const navItems = [
        { icon: Home, label: "首页", path: "/" },
        { icon: PieChart, label: "统计", path: "/stats" },
        { icon: Settings, label: "设置", path: "/settings" },
    ]

    return (
        <div className="flex h-screen w-full bg-background text-foreground">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex w-64 flex-col bg-[hsl(var(--sidebar))] border-r">
                {/* Logo 区域 */}
                <div className="p-6 pb-2">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/30">
                            <span className="text-primary-foreground font-bold text-sm">¥</span>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold tracking-tight">Money Manager</h1>
                            <p className="text-xs text-muted-foreground">Personal Finance</p>
                        </div>
                    </div>
                </div>

                {/* 导航菜单 */}
                <nav className="flex-1 px-3 py-4 space-y-1">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path
                        return (
                            <Link to={item.path} key={item.path}>
                                <div
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                                        isActive
                                            ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                                            : "text-muted-foreground hover:text-foreground hover:bg-accent"
                                    )}
                                >
                                    <item.icon className="h-4 w-4" />
                                    {item.label}
                                </div>
                            </Link>
                        )
                    })}
                </nav>

                {/* 底部版本信息 */}
                <div className="p-4 border-t">
                    <p className="text-xs text-muted-foreground text-center">v0.1.0</p>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Mobile Header */}
                <header className="md:hidden h-14 border-b flex items-center px-4 justify-between bg-card/80 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
                            <span className="text-primary-foreground font-bold text-xs">¥</span>
                        </div>
                        <h1 className="font-semibold text-sm">Money Manager</h1>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 md:p-8 md:max-w-5xl md:mx-auto md:w-full">
                    <Outlet />
                </main>

                {/* Mobile Bottom Tab Bar */}
                <div className="md:hidden border-t bg-card/80 backdrop-blur-md flex items-center justify-around px-2 py-2 z-10">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path
                        return (
                            <Link to={item.path} key={item.path} className="flex-1">
                                <div
                                    className={cn(
                                        "flex flex-col items-center justify-center py-1 space-y-0.5 transition-colors",
                                        isActive ? "text-primary" : "text-muted-foreground"
                                    )}
                                >
                                    <item.icon className={cn("h-5 w-5", isActive && "drop-shadow-sm")} />
                                    <span className="text-[10px] font-medium">{item.label}</span>
                                </div>
                            </Link>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
