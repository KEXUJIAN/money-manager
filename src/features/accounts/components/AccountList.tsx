import { useState } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/db"
import type { Account } from "@/db"
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

    if (!accounts) return <div className="animate-pulse h-24 bg-muted rounded-xl" />

    // 计算总余额
    const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0)
    const formatter = new Intl.NumberFormat("zh-CN", { style: "currency", currency: "CNY" })

    return (
        <div className="space-y-4">
            {/* 总资产概览 */}
            <div className="rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground shadow-xl shadow-primary/20">
                <p className="text-sm opacity-80">总资产</p>
                <p className="text-3xl font-bold tracking-tight mt-1">{formatter.format(totalBalance)}</p>
                <p className="text-xs opacity-60 mt-2">{accounts.length} 个账户</p>
            </div>

            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold tracking-tight">我的账户</h2>
                <Button size="sm" variant="outline" onClick={handleAdd} className="gap-1.5 rounded-lg">
                    <Plus className="h-4 w-4" /> 添加
                </Button>
            </div>
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
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
