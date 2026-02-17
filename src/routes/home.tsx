import { AccountList } from "@/features/accounts/components/AccountList"
import { TransactionList } from "@/features/transactions/components/TransactionList"
import { AddTransactionSheet } from "@/features/transactions/components/AddTransactionSheet"

export default function Home() {
    return (
        <div className="space-y-6">
            <AccountList />

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">Recent Transactions</h2>
                    <AddTransactionSheet />
                </div>
                <TransactionList />
            </div>
        </div>
    )
}
