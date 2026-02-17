import { useState } from "react"
import { format, addMonths, subMonths } from "date-fns"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useMonthlyStats } from "@/features/stats/hooks/useMonthlyStats"
import { MonthlyOverview } from "@/features/stats/components/MonthlyOverview"
import { DailyChart } from "@/features/stats/components/DailyChart"
import { CategoryBreakdown } from "@/features/stats/components/CategoryBreakdown"

export default function Stats() {
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const stats = useMonthlyStats(currentMonth)

    const goToPrevMonth = () => setCurrentMonth(prev => subMonths(prev, 1))
    const goToNextMonth = () => setCurrentMonth(prev => addMonths(prev, 1))
    const isCurrentMonth = format(currentMonth, "yyyy-MM") === format(new Date(), "yyyy-MM")

    if (!stats) return <div>Loading...</div>

    return (
        <div className="space-y-6">
            {/* 月份导航 */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">统计</h2>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={goToPrevMonth}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="font-medium min-w-[100px] text-center">
                        {format(currentMonth, "yyyy-MM")}
                    </span>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={goToNextMonth}
                        disabled={isCurrentMonth}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* 月度概览卡片 */}
            <MonthlyOverview
                totalIncome={stats.totalIncome}
                totalExpense={stats.totalExpense}
                balance={stats.balance}
            />

            {/* 每日趋势图 */}
            <DailyChart data={stats.dailyData} />

            {/* 分类饼图 */}
            <div className="grid gap-4 md:grid-cols-2">
                <CategoryBreakdown title="支出分类" data={stats.expenseByCategory} />
                <CategoryBreakdown title="收入分类" data={stats.incomeByCategory} />
            </div>
        </div>
    )
}
