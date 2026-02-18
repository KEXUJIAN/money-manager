import { useState, useMemo } from "react"
import { format, add, sub } from "date-fns"
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useStats } from "@/features/stats/hooks/useStats"
import { MonthlyOverview } from "@/features/stats/components/MonthlyOverview"
import { DailyChart } from "@/features/stats/components/DailyChart"
import { CategoryBreakdown } from "@/features/stats/components/CategoryBreakdown"
import { getDateRange, type TimeDimension } from "@/features/stats/utils"

export default function Stats() {
    const [dimension, setDimension] = useState<TimeDimension>("month")
    const [currentDate, setCurrentDate] = useState(new Date())

    const dateRange = useMemo(() => getDateRange(dimension, currentDate), [dimension, currentDate])
    const stats = useStats(dateRange)

    const navigate = (direction: "prev" | "next") => {
        const amount = direction === "prev" ? -1 : 1
        let newDate = new Date(currentDate)

        switch (dimension) {
            case "day":
                newDate = add(newDate, { days: amount })
                break
            case "week":
                newDate = add(newDate, { weeks: amount })
                break
            case "month":
                newDate = add(newDate, { months: amount })
                break
            case "year":
                newDate = add(newDate, { years: amount })
                break
            default:
                break
        }
        setCurrentDate(newDate)
    }

    const setShortcut = (d: TimeDimension, dateStr?: "today" | "yesterday" | "last-week" | "last-month" | "this-year") => {
        setDimension(d)
        const now = new Date()
        switch (dateStr) {
            case "today":
                setCurrentDate(now)
                break
            case "yesterday":
                setCurrentDate(sub(now, { days: 1 }))
                break
            case "last-week":
                setCurrentDate(sub(now, { weeks: 1 }))
                break
            case "last-month":
                setCurrentDate(sub(now, { months: 1 }))
                break
            case "this-year":
                setCurrentDate(now)
                break
            default:
                setCurrentDate(now)
        }
    }

    const formatRangeDisplay = () => {
        const { start, end } = dateRange
        if (dimension === "day") return format(start, "yyyy-MM-dd")
        if (dimension === "month") return format(start, "yyyy-MM")
        if (dimension === "year") return format(start, "yyyy")
        if (dimension === "all") return "全部时间"
        return `${format(start, "MM/dd")} - ${format(end, "MM/dd")}`
    }

    if (!stats) return <div className="p-8 text-center text-muted-foreground">加载统计数据中...</div>

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <h2 className="text-xl font-bold">统计分析</h2>

                {/* 快捷按钮组 */}
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShortcut("day", "today")}>今天</Button>
                    <Button variant="outline" size="sm" onClick={() => setShortcut("day", "yesterday")}>昨天</Button>
                    <Button variant="outline" size="sm" onClick={() => setShortcut("week", "last-week")}>上周</Button>
                    <Button variant="outline" size="sm" onClick={() => setShortcut("month", "last-month")}>上月</Button>
                    <Button variant="outline" size="sm" onClick={() => setShortcut("year", "this-year")}>本年度</Button>
                </div>
            </div>

            {/* 控制栏 */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between bg-card p-4 rounded-lg border shadow-sm">
                <div className="flex items-center gap-2">
                    <Select value={dimension} onValueChange={(v) => setDimension(v as TimeDimension)}>
                        <SelectTrigger className="w-[100px]">
                            <SelectValue placeholder="维度" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="day">按日</SelectItem>
                            <SelectItem value="week">按周</SelectItem>
                            <SelectItem value="month">按月</SelectItem>
                            <SelectItem value="year">按年</SelectItem>
                            <SelectItem value="all">全部</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate("prev")} disabled={dimension === "all"}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-2 font-medium min-w-[140px] justify-center">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {formatRangeDisplay()}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => navigate("next")} disabled={dimension === "all"}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* 概览卡片 */}
            <MonthlyOverview
                totalIncome={stats.totalIncome}
                totalExpense={stats.totalExpense}
                balance={stats.balance}
            />

            {/* 趋势图 */}
            <DailyChart data={stats.dailyData} />

            {/* 分类饼图 */}
            <div className="grid gap-4 md:grid-cols-2">
                <CategoryBreakdown title="支出分类" data={stats.expenseByCategory} />
                <CategoryBreakdown title="收入分类" data={stats.incomeByCategory} />
            </div>
        </div>
    )
}
