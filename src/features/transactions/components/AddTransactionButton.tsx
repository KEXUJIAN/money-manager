import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TransactionFormSheet } from "./AddTransactionSheet"

export function AddTransactionButton() {
    const [open, setOpen] = useState(false)

    return (
        <>
            <Button 
                onClick={() => setOpen(true)}
                className="rounded-full h-14 w-14 md:h-12 md:w-auto md:px-5 shadow-xl fixed bottom-20 right-4 md:bottom-8 md:right-8 z-50 flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
            >
                <Plus className="h-6 w-6 md:mr-2 md:h-5 md:w-5" />
                <span className="hidden md:inline font-medium">记一笔</span>
            </Button>

            <TransactionFormSheet 
                open={open} 
                onOpenChange={setOpen} 
            />
        </>
    )
}
