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
                className="rounded-full h-12 w-12 shadow-lg fixed bottom-20 right-6 z-20 md:static md:h-9 md:w-auto md:shadow-none md:rounded-md"
            >
                <Plus className="h-6 w-6 md:mr-2 md:h-4 md:w-4" />
                <span className="hidden md:inline">记一笔</span>
            </Button>

            <TransactionFormSheet 
                open={open} 
                onOpenChange={setOpen} 
            />
        </>
    )
}
