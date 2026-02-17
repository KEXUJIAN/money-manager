import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/db"
import { format } from "date-fns"
import { ArrowRightLeft } from "lucide-react"

export function TransactionList() {
    const transactions = useLiveQuery(async () => {
        const txs = await db.transactions
            .orderBy('date')
            .reverse()
            .limit(20)
            .toArray();

        return Promise.all(txs.map(async (tx) => {
            const account = await db.accounts.get(tx.accountId);
            const category = tx.categoryId ? await db.categories.get(tx.categoryId) : null;
            const toAccount = tx.toAccountId ? await db.accounts.get(tx.toAccountId) : null;

            return {
                ...tx,
                accountName: account?.name || 'Unknown Account',
                categoryName: category?.name,
                categoryIcon: category?.icon,
                toAccountName: toAccount?.name
            };
        }));
    });

    if (!transactions) return <div>Loading transactions...</div>
    if (transactions.length === 0) {
        return (
            <div className="p-8 text-center border rounded shadow-sm bg-card">
                <p className="text-muted-foreground">No transactions yet.</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="border rounded-md shadow-sm bg-card divide-y">
                {transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-full ${tx.type === 'income' ? 'bg-green-100 text-green-600' :
                                    tx.type === 'expense' ? 'bg-red-100 text-red-600' :
                                        'bg-blue-100 text-blue-600'
                                }`}>
                                {/* Simple icon logic for now, later use category icons */}
                                {tx.type === 'transfer' ? <ArrowRightLeft className="h-4 w-4" /> :
                                    <div className="h-4 w-4 font-bold text-xs flex items-center justify-center">
                                        {tx.categoryName ? tx.categoryName[0] : '?'}
                                    </div>
                                }
                            </div>
                            <div>
                                <div className="font-medium text-sm">
                                    {tx.type === 'transfer'
                                        ? `Transfer to ${tx.toAccountName}`
                                        : tx.categoryName || tx.note || 'Uncategorized'}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {format(tx.date, 'PPP')} • {tx.accountName}
                                </div>
                            </div>
                        </div>
                        <div className={`font-bold ${tx.type === 'income' ? 'text-green-600' :
                                tx.type === 'expense' ? 'text-red-600' :
                                    ''
                            }`}>
                            {tx.type === 'expense' ? '-' : tx.type === 'income' ? '+' : ''}
                            {new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(tx.amount)}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
