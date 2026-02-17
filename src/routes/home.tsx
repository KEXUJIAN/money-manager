import { AccountList } from "@/features/accounts/components/AccountList"
import { TransactionList } from "@/features/transactions/components/TransactionList"
import { AddTransactionSheet } from "@/features/transactions/components/AddTransactionSheet"

export default function Home() {
    return (
        <div className="space-y-8">
            <AccountList />

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold tracking-tight">最近交易</h2>
                    <AddTransactionSheet />
                </div>
                <TransactionList />
            </div>
        </div>
    )
}
