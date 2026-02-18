import { useState, useMemo } from "react"
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface DateTimePickerProps {
    value: Date
    onChange: (date: Date) => void
    className?: string
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
        <Popover open={open} onOpenChange={setOpen}>
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
            <PopoverContent className="w-auto p-0" align="start">
                {/* 日历区域 */}
                <Calendar
                    mode="single"
                    selected={value}
                    onSelect={handleDateSelect}
                    initialFocus
                />
                {/* 时间选择区域 */}
                <div className="border-t px-3 py-3 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <Select value={currentHour} onValueChange={handleHourChange}>
                        <SelectTrigger className="w-[70px] h-8">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px]">
                            {hours.map(h => (
                                <SelectItem key={h} value={h}>{h}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <span className="text-muted-foreground font-medium">:</span>
                    <Select value={currentMinute} onValueChange={handleMinuteChange}>
                        <SelectTrigger className="w-[70px] h-8">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px]">
                            {minutes.map(m => (
                                <SelectItem key={m} value={m}>{m}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="ml-auto h-8 text-xs"
                        onClick={handleNow}
                    >
                        现在
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    )
}
