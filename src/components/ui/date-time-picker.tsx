import { useState, useMemo, useRef, useEffect, useCallback } from "react"
import { format } from "date-fns"
import { CalendarIcon, Clock, ChevronUp, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface DateTimePickerProps {
    value: Date
    onChange: (date: Date) => void
    className?: string
}

/**
 * 精致的时间滚轮选择器
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
    const isScrollingRef = useRef(false)

    const scrollToValue = useCallback((val: string, behavior: ScrollBehavior = "instant") => {
        if (!containerRef.current) return
        const idx = items.indexOf(val)
        if (idx < 0) return
        const itemHeight = 32
        const containerHeight = containerRef.current.clientHeight
        const scrollTop = idx * itemHeight - (containerHeight / 2 - itemHeight / 2)
        isScrollingRef.current = true
        containerRef.current.scrollTo({ top: scrollTop, behavior })
        setTimeout(() => { isScrollingRef.current = false }, 150)
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
        <div className="flex flex-col items-center gap-0.5">
            <button
                type="button"
                className="h-5 w-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors rounded"
                onClick={stepUp}
            >
                <ChevronUp className="h-3.5 w-3.5" />
            </button>
            <div
                ref={containerRef}
                className="h-[96px] w-[48px] overflow-y-auto rounded-md scrollbar-none relative"
                style={{ scrollbarWidth: "none" }}
            >
                {items.map(item => (
                    <button
                        key={item}
                        type="button"
                        className={cn(
                            "w-full h-8 flex items-center justify-center text-sm transition-all rounded-md",
                            value === item
                                ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
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
                className="h-5 w-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors rounded"
                onClick={stepDown}
            >
                <ChevronDown className="h-3.5 w-3.5" />
            </button>
        </div>
    )
}

export function DateTimePicker({ value, onChange, className }: DateTimePickerProps) {
    const [open, setOpen] = useState(false)

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

    function handleDateSelect(day: Date | undefined) {
        if (!day) return
        const next = new Date(day)
        next.setHours(value.getHours(), value.getMinutes(), 0, 0)
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
    }

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
                {/* 日历区域 */}
                <Calendar
                    mode="single"
                    selected={value}
                    onSelect={handleDateSelect}
                    initialFocus
                />

                {/* 时间选择区域 */}
                <div className="border-t px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">时间</span>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-muted-foreground hover:text-foreground"
                            onClick={handleNow}
                        >
                            回到现在
                        </Button>
                    </div>

                    <div className="flex items-center justify-center gap-2 mt-2">
                        <TimeWheel
                            items={hours}
                            value={currentHour}
                            onChange={handleHourChange}
                        />
                        <span className="text-lg font-semibold text-muted-foreground select-none">:</span>
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
