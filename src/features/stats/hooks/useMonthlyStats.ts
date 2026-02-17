import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/db"
import {
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    format,
} from "date-fns"

export interface DailyData {
    date: string        // "MM/dd"
    income: number
    expense: number
}

export interface CategoryData {
    name: string
    value: number
    color: string
}

export interface MonthlyStats {
    totalIncome: number
    totalExpense: number
    balance: number
    dailyData: DailyData[]
    expenseByCategory: CategoryData[]
    incomeByCategory: CategoryData[]
}

// 预设颜色列表
const COLORS = [
    "#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4",
    "#3b82f6", "#8b5cf6", "#ec4899", "#64748b", "#14b8a6",
]

export function useMonthlyStats(monthDate: Date): MonthlyStats | undefined {
    return useLiveQuery(async () => {
        const monthStart = startOfMonth(monthDate).getTime()
        const monthEnd = endOfMonth(monthDate).getTime()

        // 获取当月所有交易
        const transactions = await db.transactions
            .where("date")
            .between(monthStart, monthEnd, true, true)
            .toArray()

        // 获取所有分类用于名称映射
        const categories = await db.categories.toArray()
        const categoryMap = new Map(categories.map(c => [c.id, c]))

        let totalIncome = 0
        let totalExpense = 0

        // 按日期分组
        const dailyMap = new Map<string, { income: number; expense: number }>()
        // 按分类分组
        const expenseCategoryMap = new Map<string, number>()
        const incomeCategoryMap = new Map<string, number>()

        for (const tx of transactions) {
            if (tx.type === "income") {
                totalIncome += tx.amount
                if (tx.categoryId) {
                    incomeCategoryMap.set(
                        tx.categoryId,
                        (incomeCategoryMap.get(tx.categoryId) || 0) + tx.amount
                    )
                }
            } else if (tx.type === "expense") {
                totalExpense += tx.amount
                if (tx.categoryId) {
                    expenseCategoryMap.set(
                        tx.categoryId,
                        (expenseCategoryMap.get(tx.categoryId) || 0) + tx.amount
                    )
                }
            }

            const dayKey = format(tx.date, "MM/dd")
            const existing = dailyMap.get(dayKey) || { income: 0, expense: 0 }
            if (tx.type === "income") existing.income += tx.amount
            if (tx.type === "expense") existing.expense += tx.amount
            dailyMap.set(dayKey, existing)
        }

        // 填充当月每一天（即使没数据也显示）
        const days = eachDayOfInterval({ start: startOfMonth(monthDate), end: endOfMonth(monthDate) })
        const dailyData: DailyData[] = days.map(day => {
            const key = format(day, "MM/dd")
            const data = dailyMap.get(key)
            return {
                date: key,
                income: data?.income || 0,
                expense: data?.expense || 0,
            }
        })

        // 转换分类数据
        const expenseByCategory: CategoryData[] = Array.from(expenseCategoryMap.entries())
            .map(([catId, value], i) => ({
                name: categoryMap.get(catId)?.name || "Unknown",
                value,
                color: COLORS[i % COLORS.length],
            }))
            .sort((a, b) => b.value - a.value)

        const incomeByCategory: CategoryData[] = Array.from(incomeCategoryMap.entries())
            .map(([catId, value], i) => ({
                name: categoryMap.get(catId)?.name || "Unknown",
                value,
                color: COLORS[i % COLORS.length],
            }))
            .sort((a, b) => b.value - a.value)

        return {
            totalIncome,
            totalExpense,
            balance: totalIncome - totalExpense,
            dailyData,
            expenseByCategory,
            incomeByCategory,
        }
    }, [monthDate])
}
