import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/db"
import { format } from "date-fns"

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

            return {
                ...tx,
                accountName: account?.name || '未知账户',
                categoryName: category?.name,
            };
        }));
    });

    if (!transactions) return <div className="animate-pulse h-32 bg-muted rounded-xl" />
    if (transactions.length === 0) {
        return (
            <div className="p-12 text-center rounded-xl border border-dashed">
                <div className="text-4xl mb-3">📝</div>
                <p className="text-muted-foreground text-sm">还没有交易记录</p>
                <p className="text-muted-foreground text-xs mt-1">点击右上角按钮开始记一笔</p>
            </div>
        )
    }

    const formatter = new Intl.NumberFormat("zh-CN", { style: "currency", currency: "CNY" })

    return (
        <div className="rounded-xl border bg-card overflow-hidden">
            {transactions.map((tx, i) => (
                <div
                    key={tx.id}
                    className={`flex items-center justify-between px-4 py-3.5 hover:bg-muted/50 transition-colors ${i !== transactions.length - 1 ? "border-b" : ""
                        }`}
                >
                    <div className="flex items-center gap-3">
                        <div className={`h-9 w-9 rounded-xl flex items-center justify-center text-sm font-bold ${tx.type === 'income'
                            ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                            <span>{tx.categoryName ? tx.categoryName[0] : '?'}</span>
                        </div>
                        <div>
                            <p className="text-sm font-medium leading-none">
                                {tx.categoryName || tx.note || '未分类'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {format(tx.date, 'MM/dd')} · {tx.accountName}
                            </p>
                        </div>
                    </div>
                    <span className={`text-sm font-semibold tabular-nums ${tx.type === 'income'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400'
                        }`}>
                        {tx.type === 'expense' ? '-' : '+'}
                        {formatter.format(tx.amount)}
                    </span>
                </div>
            ))}
        </div>
    )
}
