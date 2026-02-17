import { AccountList } from "@/features/accounts/components/AccountList"

export default function Home() {
    return (
        <div className="space-y-6">
            <AccountList />

            <div className="space-y-4">
                <h2 className="text-xl font-bold">Recent Transactions</h2>
                <div className="p-4 border rounded shadow-sm bg-card">
                    <p className="text-muted-foreground">No transactions yet.</p>
                </div>
            </div>
        </div>
    )
}
