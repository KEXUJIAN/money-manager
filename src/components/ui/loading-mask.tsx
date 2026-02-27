import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoadingMaskProps {
    open: boolean
    text?: string
    className?: string
}

export function LoadingMask({ open, text = "处理中...", className }: LoadingMaskProps) {
    if (!open) return null

    return (
        <div className={cn("fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-200", className)}>
            <div className="flex flex-col items-center gap-4 rounded-xl bg-card p-6 shadow-2xl border animate-in zoom-in-95 duration-200">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm font-medium text-foreground">{text}</p>
            </div>
        </div>
    )
}
