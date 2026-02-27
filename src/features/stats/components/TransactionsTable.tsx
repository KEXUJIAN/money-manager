import { useState, useMemo, useEffect } from "react"
import { format, add } from "date-fns"
import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/db"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { StatsPeriodPicker } from "@/features/stats/components/StatsPeriodPicker"
import { getDateRange, type TimeDimension } from "@/features/stats/utils"

export function TransactionsTable() {
    const categories = useLiveQuery(() => db.categories.toArray()) || []
    const accounts = useLiveQuery(() => db.accounts.toArray()) || []
    const allTransactions = useLiveQuery(() => db.transactions.toArray()) || []

    const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all")
    const [filterAccountId, setFilterAccountId] = useState<string>("all")
    const [searchKeyword, setSearchKeyword] = useState("")

    // 时间筛选状态
    const [dimension, setDimension] = useState<TimeDimension>("all")
    const [currentDate, setCurrentDate] = useState(new Date())

    const [currentPage, setCurrentPage] = useState(1)
    const pageSize = 20

    const categoryMap = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories])
    const accountMap = useMemo(() => new Map(accounts.map(a => [a.id, a])), [accounts])

    // 时间导航函数（复用图表的逻辑）
    const navigateDate = (direction: "prev" | "next") => {
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

    // 格式化当前时间维度的显示文本
    const formatRangeDisplay = () => {
        const { start, end } = getDateRange(dimension, currentDate)
        if (dimension === "day") return format(start, "yyyy-MM-dd")
        if (dimension === "month") return format(start, "yyyy-MM")
        if (dimension === "year") return format(start, "yyyy")
        if (dimension === "all") return "全部时间"
        return `${format(start, "MM/dd")} - ${format(end, "MM/dd")}`
    }

    const filteredData = useMemo(() => {
        // 先计算当前选中的日期范围
        const { start, end } = getDateRange(dimension, currentDate)
        const startTs = start.getTime()
        const endTs = end.getTime()

        return allTransactions.filter(tx => {
            // 时间过滤
            if (tx.date < startTs || tx.date > endTs) return false

            // 类型和账户过滤
            if (filterType !== "all" && tx.type !== filterType) return false
            if (filterAccountId !== "all" && tx.accountId !== filterAccountId) return false

            // 搜索过滤
            if (searchKeyword) {
                const catName = categoryMap.get(tx.categoryId as string)?.name || ""
                const note = tx.note || ""
                const kw = searchKeyword.toLowerCase()
                if (!catName.toLowerCase().includes(kw) && !note.toLowerCase().includes(kw)) {
                    return false
                }
            }
            return true
        }).sort((a, b) => b.date - a.date)
    }, [allTransactions, filterType, filterAccountId, searchKeyword, categoryMap, dimension, currentDate])

    const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize))

    // reset page to 1 if filters change
    useEffect(() => {
        setCurrentPage(1)
    }, [filterType, filterAccountId, searchKeyword, dimension, currentDate])

    const currentData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize)

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col xl:flex-row gap-3 xl:items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-3">
                    <Input
                        placeholder="全局搜索分类或备注..."
                        value={searchKeyword}
                        onChange={e => setSearchKeyword(e.target.value)}
                        className="sm:w-[250px]"
                    />

                    <Select value={filterType} onValueChange={(v: "all" | "income" | "expense") => setFilterType(v)}>
                        <SelectTrigger className="sm:w-[120px]">
                            <SelectValue placeholder="收支类型" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">全部收支</SelectItem>
                            <SelectItem value="expense">仅支出</SelectItem>
                            <SelectItem value="income">仅收入</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={filterAccountId} onValueChange={setFilterAccountId}>
                        <SelectTrigger className="sm:w-[150px]">
                            <SelectValue placeholder="选择账户" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">全部账户</SelectItem>
                            {accounts.map(a => (
                                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* 时间选择器 - 独立于统计图的时间维度 */}
                <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-md border text-sm">
                    <Select value={dimension} onValueChange={(v) => setDimension(v as TimeDimension)}>
                        <SelectTrigger className="w-[85px] h-8 border-none shadow-none bg-transparent outline-none ring-0 focus:ring-0">
                            <SelectValue placeholder="维度" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">全部</SelectItem>
                            <SelectItem value="day">按日</SelectItem>
                            <SelectItem value="week">按周</SelectItem>
                            <SelectItem value="month">按月</SelectItem>
                            <SelectItem value="year">按年</SelectItem>
                        </SelectContent>
                    </Select>

                    <div className="w-[1px] h-4 bg-border mx-1"></div>

                    <div className="flex items-center">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateDate("prev")} disabled={dimension === "all"}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="scale-90 transform origin-center">
                            <StatsPeriodPicker
                                dimension={dimension}
                                currentDate={currentDate}
                                onDateChange={setCurrentDate}
                                displayText={formatRangeDisplay()}
                            />
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateDate("next")} disabled={dimension === "all"}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>时间</TableHead>
                            <TableHead>分类</TableHead>
                            <TableHead>账户</TableHead>
                            <TableHead>收支</TableHead>
                            <TableHead className="text-right">金额</TableHead>
                            <TableHead>备注</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {currentData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                                    暂无符合条件的交易明细
                                </TableCell>
                            </TableRow>
                        ) : (
                            currentData.map(tx => {
                                const isExpense = tx.type === "expense"
                                return (
                                    <TableRow key={tx.id}>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {format(tx.date, "yyyy-MM-dd HH:mm")}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="font-normal">
                                                {categoryMap.get(tx.categoryId as string)?.name || "其他"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm border border-input px-2 py-0.5 rounded-md">
                                                {accountMap.get(tx.accountId as string)?.name || "未知账户"}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className={isExpense ? "text-primary" : "text-green-600"}>
                                                {isExpense ? "支出" : "收入"}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {isExpense ? "-" : "+"}{Number(tx.amount).toFixed(2)}
                                        </TableCell>
                                        <TableCell className="max-w-[150px] truncate text-muted-foreground text-sm" title={tx.note}>
                                            {tx.note || "-"}
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        共 {filteredData.length} 条记录，第 {currentPage}/{totalPages} 页
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            上一页
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                        >
                            下一页
                            <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
