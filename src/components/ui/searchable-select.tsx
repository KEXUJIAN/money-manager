import { useState, useRef, useEffect } from "react"
import { Check, ChevronsUpDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface Option {
    value: string
    label: string
}

interface SearchableSelectProps {
    options: Option[]
    value: string
    onValueChange: (value: string) => void
    placeholder?: string
    searchPlaceholder?: string
    className?: string
}

/**
 * 将搜索关键词在文本中高亮
 */
function highlightMatch(text: string, keyword: string) {
    const idx = text.toLowerCase().indexOf(keyword.toLowerCase())
    if (idx < 0) return text
    const before = text.slice(0, idx)
    const match = text.slice(idx, idx + keyword.length)
    const after = text.slice(idx + keyword.length)
    return (
        <>
            {before}
            <mark className="bg-yellow-200 dark:bg-yellow-700/60 text-inherit rounded-sm px-0.5">{match}</mark>
            {after}
        </>
    )
}
export function SearchableSelect({
    options,
    value,
    onValueChange,
    placeholder = "请选择...",
    searchPlaceholder = "搜索...",
    className,
}: SearchableSelectProps) {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState("")
    const inputRef = useRef<HTMLInputElement>(null)

    const filtered = search
        ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
        : options

    const selectedLabel = options.find(o => o.value === value)?.label

    // 打开时自动聚焦搜索框
    useEffect(() => {
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 50)
        } else {
            setSearch("")
        }
    }, [open])

    return (
        <Popover open={open} onOpenChange={setOpen} modal>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between font-normal", className)}
                >
                    <span className={cn(!selectedLabel && "text-muted-foreground")}>
                        {selectedLabel || placeholder}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="z-[200] w-[--radix-popover-trigger-width] p-0" align="start">
                {/* 搜索框 */}
                <div className="flex items-center border-b px-3 py-2">
                    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                    <input
                        ref={inputRef}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder={searchPlaceholder}
                        className="flex h-8 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    />
                </div>
                {/* 选项列表 */}
                <div className="max-h-[200px] overflow-y-auto p-1">
                    {filtered.length === 0 ? (
                        <p className="py-4 text-center text-sm text-muted-foreground">无匹配项</p>
                    ) : (
                        filtered.map(option => (
                            <button
                                key={option.value}
                                type="button"
                                className={cn(
                                    "relative flex w-full items-center rounded-sm px-2 py-1.5 text-sm outline-none",
                                    "hover:bg-accent hover:text-accent-foreground",
                                    "transition-colors",
                                    value === option.value && "bg-accent"
                                )}
                                onClick={() => {
                                    onValueChange(option.value)
                                    setOpen(false)
                                }}
                            >
                                <Check
                                    className={cn(
                                        "mr-2 h-4 w-4",
                                        value === option.value ? "opacity-100" : "opacity-0"
                                    )}
                                />
                                {search ? highlightMatch(option.label, search) : option.label}
                            </button>
                        ))
                    )}
                </div>
            </PopoverContent>
        </Popover>
    )
}
