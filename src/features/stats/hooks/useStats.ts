
import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/db"
import {
    eachDayOfInterval,
    format,
} from "date-fns"
import type { DateRange } from "../utils"
import { plus, minus, formatAmount } from "@/lib/math"

export interface DailyData {
    date: string        // "MM/dd" or "yyyy-MM-dd" depending on range?
    income: number
    expense: number
    timestamp: number   // for sorting
}

export interface CategoryData {
    id: string
    name: string
    value: number
    color: string
}

export interface StatsData {
    totalIncome: number
    totalExpense: number
    balance: number
    dailyData: DailyData[]
    expenseByCategory: CategoryData[]
    incomeByCategory: CategoryData[]
}



export function useStats(dateRange: DateRange): StatsData | undefined {
    return useLiveQuery(async () => {
        const start = dateRange.start.getTime()
        const end = dateRange.end.getTime()

        // 获取范围内所有交易
        const transactions = await db.transactions
            .where("date")
            .between(start, end, true, true)
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
                totalIncome = plus(totalIncome, tx.amount)
                if (tx.categoryId) {
                    incomeCategoryMap.set(
                        tx.categoryId,
                        plus((incomeCategoryMap.get(tx.categoryId) || 0), tx.amount)
                    )
                }
            } else if (tx.type === "expense") {
                totalExpense = plus(totalExpense, tx.amount)
                if (tx.categoryId) {
                    expenseCategoryMap.set(
                        tx.categoryId,
                        plus((expenseCategoryMap.get(tx.categoryId) || 0), tx.amount)
                    )
                }
            }

            // 使用 timestamp 作为 key 以便于后续排序和格式化
            // 为了简化，我们按天归档。对于“全部”或“年”视图，可能需要按月归档？
            // 需求说“日、周、月、年、全部”。
            // 如果范围很大（比如全部），dailyData 可能会很多点。但 Recharts 应该能处理。
            // 暂时统一按天。
            const dayKey = format(tx.date, "yyyy-MM-dd")
            const existing = dailyMap.get(dayKey) || { income: 0, expense: 0 }
            if (tx.type === "income") existing.income = plus(existing.income, tx.amount)
            if (tx.type === "expense") existing.expense = plus(existing.expense, tx.amount)
            dailyMap.set(dayKey, existing)
        }

        // 填充每一天（如果范围太大可能性能有问题，但在 indexeddb 本地应用应该还可以）
        // 如果是 'all'，start 是 0，end 是 huge。不要生成 intervening days unless range is reasonable.
        // 如果 range > 365 days，也许只显示有数据的 days? 或者按月聚合?
        // 简单起见，如果它是 "all" 或 "year"，我们只显示有数据的日子，或者按月聚合。
        // 为了 milestone 0.2，先简单实现：总是按天，对于 'all' 可能比较密集。
        // 但 eachDayOfInterval on huge range will crash.

        let dailyData: DailyData[] = []
        const daysDiff = (end - start) / (1000 * 60 * 60 * 24)

        if (daysDiff > 365 * 5) { // 超过 5 年
            // 只返回有数据的点，排序
            dailyData = Array.from(dailyMap.entries()).map(([dateStr, val]) => ({
                date: dateStr,
                income: val.income,
                expense: val.expense,
                timestamp: new Date(dateStr).getTime()
            })).sort((a, b) => a.timestamp - b.timestamp)
        } else {
            // 正常填充
            try {
                const days = eachDayOfInterval({ start: dateRange.start, end: dateRange.end })
                dailyData = days.map(day => {
                    const key = format(day, "yyyy-MM-dd")
                    const data = dailyMap.get(key)
                    return {
                        date: format(day, "MM/dd"),
                        income: data?.income || 0,
                        expense: data?.expense || 0,
                        timestamp: day.getTime()
                    }
                })
            } catch (e) {
                // Fallback for extreme cases
                dailyData = []
            }
        }

        // 转换分类数据
        const expenseByCategory: CategoryData[] = Array.from(expenseCategoryMap.entries())
            .map(([catId, value], i) => ({
                id: catId,
                name: categoryMap.get(catId)?.name || "Unknown",
                value,
                color: `hsl(${(i * 137.5) % 360}, 70%, 50%)`,
            }))
            .sort((a, b) => b.value - a.value)

        const incomeByCategory: CategoryData[] = Array.from(incomeCategoryMap.entries())
            .map(([catId, value], i) => ({
                id: catId,
                name: categoryMap.get(catId)?.name || "Unknown",
                value,
                color: `hsl(${(i * 137.5) % 360}, 70%, 50%)`,
            }))
            .sort((a, b) => b.value - a.value)

        return {
            totalIncome: formatAmount(totalIncome),
            totalExpense: formatAmount(totalExpense),
            balance: formatAmount(minus(totalIncome, totalExpense)),
            dailyData,
            expenseByCategory,
            incomeByCategory,
        }
    }, [dateRange.start.getTime(), dateRange.end.getTime()]) // Use timestamp to avoid deep compare issues if object ref changes
}
