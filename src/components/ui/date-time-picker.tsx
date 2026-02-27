import { useState, useMemo, useRef, useEffect, useCallback } from "react"
import { format } from "date-fns"
import { CalendarIcon, Clock, ChevronUp, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

const WEEKDAY_LABELS = ["一", "二", "三", "四", "五", "六", "日"]
const monthNames = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"]

function getCalendarDays(year: number, month: number) {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()

    let startWeekday = firstDay.getDay() - 1
    if (startWeekday < 0) startWeekday = 6

    const cells: (number | null)[] = []
    for (let i = 0; i < startWeekday; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(d)
    while (cells.length % 7 !== 0) cells.push(null)

    return cells
}

interface DateTimePickerProps {
    value: Date
    onChange: (date: Date) => void
    className?: string
}

/**
 * 时间滚轮选择器
 */
function TimeWheel({
    items,
    value,
    onChange,
}: {
    items: string[]
    value: string
    onChange: (v: string) => void
}) {
    const containerRef = useRef<HTMLDivElement>(null)

    const scrollToValue = useCallback((val: string, behavior: ScrollBehavior = "instant") => {
        if (!containerRef.current) return
        const idx = items.indexOf(val)
        if (idx < 0) return
        const itemHeight = 36
        const containerHeight = containerRef.current.clientHeight
        const scrollTop = idx * itemHeight - (containerHeight / 2 - itemHeight / 2)
        containerRef.current.scrollTo({ top: scrollTop, behavior })
    }, [items])

    useEffect(() => {
        scrollToValue(value)
    }, [value, scrollToValue])

    const currentIdx = items.indexOf(value)

    function stepUp() {
        const newIdx = Math.max(0, currentIdx - 1)
        onChange(items[newIdx])
        scrollToValue(items[newIdx], "smooth")
    }

    function stepDown() {
        const newIdx = Math.min(items.length - 1, currentIdx + 1)
        onChange(items[newIdx])
        scrollToValue(items[newIdx], "smooth")
    }

    return (
        <div className="flex flex-col items-center">
            <button
                type="button"
                className="h-7 w-full flex items-center justify-center text-muted-foreground/60 hover:text-foreground transition-colors rounded-md hover:bg-muted/50"
                onClick={stepUp}
            >
                <ChevronUp className="h-4 w-4" />
            </button>
            <div
                ref={containerRef}
                className="h-[108px] w-[60px] overflow-y-auto rounded-lg"
                style={{ scrollbarWidth: "none" }}
            >
                {items.map(item => (
                    <button
                        key={item}
                        type="button"
                        className={cn(
                            "w-full h-9 flex items-center justify-center text-sm transition-all rounded-lg",
                            value === item
                                ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                        onClick={() => {
                            onChange(item)
                            scrollToValue(item, "smooth")
                        }}
                    >
                        {item}
                    </button>
                ))}
            </div>
            <button
                type="button"
                className="h-7 w-full flex items-center justify-center text-muted-foreground/60 hover:text-foreground transition-colors rounded-md hover:bg-muted/50"
                onClick={stepDown}
            >
                <ChevronDown className="h-4 w-4" />
            </button>
        </div>
    )
}

export function DateTimePicker({ value, onChange, className }: DateTimePickerProps) {
    const [open, setOpen] = useState(false)

    const [viewYear, setViewYear] = useState(value.getFullYear())
    const [viewMonth, setViewMonth] = useState(value.getMonth())

    useEffect(() => {
        if (open) {
            setViewYear(value.getFullYear())
            setViewMonth(value.getMonth())
        }
    }, [value, open])

    const hours = useMemo(() =>
        Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')),
        []
    )
    const minutes = useMemo(() =>
        Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')),
        []
    )

    const currentHour = String(value.getHours()).padStart(2, '0')
    const currentMinute = String(value.getMinutes()).padStart(2, '0')

    function handleDateSelect(year: number, month: number, day: number) {
        const next = new Date(value)
        next.setFullYear(year, month, day)
        onChange(next)
    }

    function handleHourChange(h: string) {
        const next = new Date(value)
        next.setHours(parseInt(h), value.getMinutes(), 0, 0)
        onChange(next)
    }

    function handleMinuteChange(m: string) {
        const next = new Date(value)
        next.setHours(value.getHours(), parseInt(m), 0, 0)
        onChange(next)
    }

    function handleNow() {
        const now = new Date()
        now.setSeconds(0, 0)
        onChange(now)
        setViewYear(now.getFullYear())
        setViewMonth(now.getMonth())
    }

    function prevMonth() {
        if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
        else setViewMonth(m => m - 1)
    }

    function nextMonth() {
        if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
        else setViewMonth(m => m + 1)
    }

    const cells = getCalendarDays(viewYear, viewMonth)
    const selectedDay = value.getDate()
    const selectedMonth = value.getMonth()
    const selectedYear = value.getFullYear()

    const today = new Date()
    const todayDay = today.getDate()
    const todayMonth = today.getMonth()
    const todayYear = today.getFullYear()

    return (
        <Popover open={open} onOpenChange={setOpen} modal>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        className
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />
                    {format(value, "yyyy-MM-dd HH:mm")}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="z-[200] w-auto p-0" align="start">
                {/* 仿统计页面的日历区域 */}
                <div className="p-4 w-[320px]">
                    {/* 年月导航 */}
                    <div className="flex items-center justify-between mb-4">
                        <button
                            type="button"
                            className="text-sm px-2 py-1 flex items-center justify-center rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                            onClick={prevMonth}
                        >
                            ◀
                        </button>
                        <span className="text-[15px] font-semibold">{viewYear}年 {monthNames[viewMonth]}</span>
                        <button
                            type="button"
                            className="text-sm px-2 py-1 flex items-center justify-center rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                            onClick={nextMonth}
                        >
                            ▶
                        </button>
                    </div>
                    {/* 星期标头 */}
                    <div className="grid grid-cols-7 mb-2">
                        {WEEKDAY_LABELS.map(w => (
                            <div key={w} className="text-center text-xs text-muted-foreground font-medium py-1">{w}</div>
                        ))}
                    </div>
                    {/* 日期格子 */}
                    <div className="grid grid-cols-7 gap-y-1">
                        {cells.map((day, idx) => {
                            if (day === null) {
                                return <div key={`e-${idx}`} className="h-10" />
                            }

                            const isSelected = day === selectedDay && viewMonth === selectedMonth && viewYear === selectedYear
                            const isToday = day === todayDay && viewMonth === todayMonth && viewYear === todayYear

                            return (
                                <button
                                    key={idx}
                                    type="button"
                                    className={cn(
                                        "h-10 w-full text-sm rounded-lg transition-colors flex items-center justify-center mx-auto",
                                        "hover:bg-accent hover:text-accent-foreground max-w-[40px]",
                                        isSelected
                                            ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                                            : isToday
                                                ? "bg-accent/60 font-medium text-foreground"
                                                : "text-foreground"
                                    )}
                                    onClick={() => handleDateSelect(viewYear, viewMonth, day)}
                                >
                                    {day}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* 时间选择区域 */}
                <div className="border-t bg-muted/20 px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium text-muted-foreground">选择时间</span>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={handleNow}
                        >
                            回到现在
                        </Button>
                    </div>

                    <div className="flex items-center justify-center gap-1 py-1">
                        <TimeWheel
                            items={hours}
                            value={currentHour}
                            onChange={handleHourChange}
                        />
                        <span className="text-xl font-bold text-muted-foreground/50 select-none pb-1">:</span>
                        <TimeWheel
                            items={minutes}
                            value={currentMinute}
                            onChange={handleMinuteChange}
                        />
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
