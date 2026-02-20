import { useState } from "react"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
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

const WEEKDAY_LABELS = ["一", "二", "三", "四", "五", "六", "日"]

/**
 * 获取某月的日历格子（按周一为起始，补齐前后空白）
 */
function getCalendarDays(year: number, month: number) {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()

    // 周一=0 ... 周日=6
    let startWeekday = firstDay.getDay() - 1
    if (startWeekday < 0) startWeekday = 6

    const cells: (number | null)[] = []
    for (let i = 0; i < startWeekday; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(d)
    while (cells.length % 7 !== 0) cells.push(null)

    return cells
}

/**
 * 日期选择面板：年月导航 + 日期网格（与 MonthPanel/YearPanel 同风格）
 */
function DayPanel({
    currentDate,
    onSelect,
}: {
    currentDate: Date
    onSelect: (date: Date) => void
}) {
    const [viewYear, setViewYear] = useState(currentDate.getFullYear())
    const [viewMonth, setViewMonth] = useState(currentDate.getMonth())

    const selectedDay = currentDate.getDate()
    const selectedMonth = currentDate.getMonth()
    const selectedYear = currentDate.getFullYear()

    const cells = getCalendarDays(viewYear, viewMonth)

    const today = new Date()
    const todayDay = today.getDate()
    const todayMonth = today.getMonth()
    const todayYear = today.getFullYear()

    function prevMonth() {
        if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
        else setViewMonth(m => m - 1)
    }
    function nextMonth() {
        if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
        else setViewMonth(m => m + 1)
    }

    const monthNames = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"]

    return (
        <div className="p-3 w-[300px]">
            {/* 年月导航 */}
            <div className="flex items-center justify-between mb-3">
                <button
                    type="button"
                    className="text-sm px-2 py-1 rounded hover:bg-muted transition-colors"
                    onClick={prevMonth}
                >
                    ◀
                </button>
                <span className="text-sm font-semibold">{viewYear}年 {monthNames[viewMonth]}</span>
                <button
                    type="button"
                    className="text-sm px-2 py-1 rounded hover:bg-muted transition-colors"
                    onClick={nextMonth}
                >
                    ▶
                </button>
            </div>
            {/* 星期标头 */}
            <div className="grid grid-cols-7 mb-1">
                {WEEKDAY_LABELS.map(w => (
                    <div key={w} className="text-center text-xs text-muted-foreground font-medium py-1">{w}</div>
                ))}
            </div>
            {/* 日期格子 */}
            <div className="grid grid-cols-7">
                {cells.map((day, idx) => {
                    if (day === null) {
                        return <div key={`e-${idx}`} className="h-9" />
                    }

                    const isSelected = day === selectedDay && viewMonth === selectedMonth && viewYear === selectedYear
                    const isToday = day === todayDay && viewMonth === todayMonth && viewYear === todayYear

                    return (
                        <button
                            key={idx}
                            type="button"
                            className={cn(
                                "h-9 w-full text-sm rounded-md transition-colors",
                                "hover:bg-accent hover:text-accent-foreground",
                                isSelected
                                    ? "bg-primary text-primary-foreground font-semibold"
                                    : isToday
                                        ? "bg-accent/60 font-medium"
                                        : "text-foreground"
                            )}
                            onClick={() => {
                                const d = new Date(currentDate)
                                d.setFullYear(viewYear)
                                d.setMonth(viewMonth)
                                d.setDate(day)
                                onSelect(d)
                            }}
                        >
                            {day}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

/**
 * 月份选择面板：上方年份导航 + 12 个月份格子
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
                return <DayPanel currentDate={currentDate} onSelect={handleSelect} />
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
