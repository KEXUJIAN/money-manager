import { useState } from "react"
import { zhCN } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

type TimeDimension = "day" | "week" | "month" | "year" | "all"

interface StatsPeriodPickerProps {
    dimension: TimeDimension
    currentDate: Date
    onDateChange: (date: Date) => void
    displayText: string
}

/**
 * 月份选择面板：上方年份下拉 + 12 个月份格子
 */
function MonthPanel({
    currentDate,
    onSelect,
}: {
    currentDate: Date
    onSelect: (date: Date) => void
}) {
    const [year, setYear] = useState(currentDate.getFullYear())
    const currentMonth = currentDate.getMonth()
    const currentYear = currentDate.getFullYear()

    const months = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"]
    const years = Array.from({ length: 16 }, (_, i) => 2015 + i)

    return (
        <div className="p-3 w-[260px]">
            {/* 年份选择 */}
            <div className="flex items-center justify-between mb-3">
                <button
                    type="button"
                    className="text-sm px-2 py-1 rounded hover:bg-muted transition-colors"
                    onClick={() => setYear(y => y - 1)}
                >
                    ◀
                </button>
                <select
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="text-sm font-semibold bg-transparent border rounded px-2 py-1 cursor-pointer"
                >
                    {years.map(y => (
                        <option key={y} value={y}>{y}年</option>
                    ))}
                </select>
                <button
                    type="button"
                    className="text-sm px-2 py-1 rounded hover:bg-muted transition-colors"
                    onClick={() => setYear(y => y + 1)}
                >
                    ▶
                </button>
            </div>
            {/* 月份格子 */}
            <div className="grid grid-cols-3 gap-2">
                {months.map((label, idx) => (
                    <button
                        key={idx}
                        type="button"
                        className={cn(
                            "py-2 px-1 text-sm rounded-md transition-colors",
                            "hover:bg-accent hover:text-accent-foreground",
                            year === currentYear && idx === currentMonth
                                ? "bg-primary text-primary-foreground font-semibold"
                                : "text-foreground"
                        )}
                        onClick={() => {
                            const d = new Date(currentDate)
                            d.setFullYear(year)
                            d.setMonth(idx)
                            d.setDate(1)
                            onSelect(d)
                        }}
                    >
                        {label}
                    </button>
                ))}
            </div>
        </div>
    )
}

/**
 * 年份选择面板：年份网格
 */
function YearPanel({
    currentDate,
    onSelect,
}: {
    currentDate: Date
    onSelect: (date: Date) => void
}) {
    const currentYear = currentDate.getFullYear()
    const years = Array.from({ length: 16 }, (_, i) => 2015 + i)

    return (
        <div className="p-3 w-[260px]">
            <p className="text-sm font-semibold text-muted-foreground mb-3 text-center">选择年份</p>
            <div className="grid grid-cols-4 gap-2">
                {years.map(y => (
                    <button
                        key={y}
                        type="button"
                        className={cn(
                            "py-2 px-1 text-sm rounded-md transition-colors",
                            "hover:bg-accent hover:text-accent-foreground",
                            y === currentYear
                                ? "bg-primary text-primary-foreground font-semibold"
                                : "text-foreground"
                        )}
                        onClick={() => {
                            const d = new Date(currentDate)
                            d.setFullYear(y)
                            d.setMonth(0)
                            d.setDate(1)
                            onSelect(d)
                        }}
                    >
                        {y}
                    </button>
                ))}
            </div>
        </div>
    )
}

export function StatsPeriodPicker({ dimension, currentDate, onDateChange, displayText }: StatsPeriodPickerProps) {
    const [open, setOpen] = useState(false)

    // "全部" 维度不可点击
    if (dimension === "all") {
        return (
            <div className="flex items-center gap-2 font-medium min-w-[160px] justify-center px-3 py-1.5 text-muted-foreground">
                <CalendarIcon className="h-4 w-4" />
                {displayText}
            </div>
        )
    }

    function handleSelect(date: Date) {
        onDateChange(date)
        setOpen(false)
    }

    function renderContent() {
        switch (dimension) {
            case "day":
            case "week":
                return (
                    <Calendar
                        mode="single"
                        selected={currentDate}
                        onSelect={(day) => { if (day) handleSelect(day) }}
                        locale={zhCN}
                        captionLayout="dropdown"
                        fromYear={2015}
                        toYear={2030}
                        initialFocus
                    />
                )
            case "month":
                return <MonthPanel currentDate={currentDate} onSelect={handleSelect} />
            case "year":
                return <YearPanel currentDate={currentDate} onSelect={handleSelect} />
            default:
                return null
        }
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className="flex items-center gap-2 font-medium min-w-[160px] justify-center cursor-pointer rounded-md px-3 py-1.5 hover:bg-muted/80 transition-colors border border-transparent hover:border-border"
                >
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    {displayText}
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
                {renderContent()}
            </PopoverContent>
        </Popover>
    )
}
