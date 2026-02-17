import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/db"
import { AccountCard } from "./AccountCard"
import { AddAccountSheet } from "./AddAccountSheet"

export function AccountList() {
    const accounts = useLiveQuery(() => db.accounts.toArray())

    if (!accounts) return <div>Loading accounts...</div>

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold tracking-tight">Accounts</h2>
                <AddAccountSheet />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {accounts.map((account) => (
                    <AccountCard key={account.id} account={account} />
                ))}
            </div>
        </div>
    )
}
