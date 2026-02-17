import { useState } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { db, type Account } from "@/db"
import { AccountCard } from "./AccountCard"
import { AccountFormSheet } from "./AccountFormSheet"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export function AccountList() {
    const accounts = useLiveQuery(() => db.accounts.toArray())
    const [sheetOpen, setSheetOpen] = useState(false)
    const [selectedAccount, setSelectedAccount] = useState<Account | undefined>(undefined)

    const handleAdd = () => {
        setSelectedAccount(undefined)
        setSheetOpen(true)
    }

    const handleEdit = (account: Account) => {
        setSelectedAccount(account)
        setSheetOpen(true)
    }

    if (!accounts) return <div>Loading accounts...</div>

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold tracking-tight">Accounts</h2>
                <Button size="sm" onClick={handleAdd}>
                    <Plus className="mr-2 h-4 w-4" /> Add Account
                </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {accounts.map((account) => (
                    <AccountCard
                        key={account.id}
                        account={account}
                        onClick={() => handleEdit(account)}
                    />
                ))}
            </div>

            <AccountFormSheet
                open={sheetOpen}
                onOpenChange={setSheetOpen}
                account={selectedAccount}
            />
        </div>
    )
}
