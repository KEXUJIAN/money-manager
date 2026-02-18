import { useState, useMemo, useRef, useEffect } from "react"
import { format } from "date-fns"
import { CalendarIcon, Clock } from "lucide-react"
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
 * 内联时间滚动选择器（不使用 Select Portal，避免 z-index 冲突）
 */
function TimeScroller({
    items,
    value,
    onChange,
    label,
}: {
    items: string[]
    value: string
    onChange: (v: string) => void
    label: string
}) {
    const containerRef = useRef<HTMLDivElement>(null)

    // 滚动到选中项
    useEffect(() => {
        if (!containerRef.current) return
        const idx = items.indexOf(value)
        if (idx >= 0) {
            const el = containerRef.current.children[idx] as HTMLElement
            el?.scrollIntoView({ block: "center", behavior: "instant" })
        }
    }, [value, items])

    return (
        <div className="flex flex-col items-center">
            <span className="text-[10px] text-muted-foreground mb-1">{label}</span>
            <div
                ref={containerRef}
                className="h-[140px] w-[52px] overflow-y-auto rounded-md border bg-background scrollbar-thin"
            >
                {items.map(item => (
                    <button
                        key={item}
                        type="button"
                        className={cn(
                            "w-full py-1 text-center text-sm transition-colors",
                            "hover:bg-accent hover:text-accent-foreground",
                            value === item && "bg-primary text-primary-foreground font-medium"
                        )}
                        onClick={() => onChange(item)}
                    >
                        {item}
                    </button>
                ))}
            </div>
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
                <div className="flex">
                    {/* 日历区域 */}
                    <Calendar
                        mode="single"
                        selected={value}
                        onSelect={handleDateSelect}
                        initialFocus
                    />
                    {/* 时间选择区域（内联滚动列表） */}
                    <div className="border-l px-2 py-3 flex items-start gap-1 pt-4">
                        <Clock className="h-4 w-4 text-muted-foreground mt-5 mr-1" />
                        <TimeScroller
                            items={hours}
                            value={currentHour}
                            onChange={handleHourChange}
                            label="时"
                        />
                        <span className="text-muted-foreground font-medium mt-[76px]">:</span>
                        <TimeScroller
                            items={minutes}
                            value={currentMinute}
                            onChange={handleMinuteChange}
                            label="分"
                        />
                    </div>
                </div>
                {/* 底部操作栏 */}
                <div className="border-t px-3 py-2 flex justify-end">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={handleNow}
                    >
                        回到现在
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    )
}
