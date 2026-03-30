import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/db"
import { format } from "date-fns"
import { useState } from "react"
import { Pencil, Trash2 } from "lucide-react"
import { TransactionFormSheet } from "./AddTransactionSheet"
import { deleteTransaction } from "@/features/transactions/utils/deleteTransaction"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export function TransactionList() {
    const [editTxId, setEditTxId] = useState<string | undefined>()
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [deleteTxId, setDeleteTxId] = useState<string | undefined>()
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    const handleEdit = (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        setEditTxId(id)
        setIsEditOpen(true)
    }

    const handleDeleteClick = (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        setDeleteTxId(id)
        setIsDeleteOpen(true)
    }

    const handleDeleteConfirm = async () => {
        if (!deleteTxId) return
        try {
            setIsDeleting(true)
            await deleteTransaction(deleteTxId)
        } catch (error) {
            console.error("删除流水失败:", error)
        } finally {
            setIsDeleting(false)
            setIsDeleteOpen(false)
            setDeleteTxId(undefined)
        }
    }

    const transactions = useLiveQuery(async () => {
        const txs = await db.transactions
            .orderBy('date')
            .reverse()
            .limit(20)
            .toArray();

        return Promise.all(txs.map(async (tx) => {
            const account = await db.accounts.get(tx.accountId);
            const category = tx.type !== 'transfer' && tx.categoryId ? await db.categories.get(tx.categoryId) : null;
            let targetAccountName = undefined;
            if (tx.type === 'transfer' && tx.transferToAccountId) {
                const toAccount = await db.accounts.get(tx.transferToAccountId);
                targetAccountName = toAccount?.name;
            }

            return {
                ...tx,
                accountName: account?.name || '未知账户',
                targetAccountName,
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
                            : tx.type === 'transfer'
                                ? 'bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400'
                                : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                            <span>{tx.type === 'transfer' ? '流' : (tx.categoryName ? tx.categoryName[0] : '?')}</span>
                        </div>
                        <div>
                            <p className="text-sm font-medium leading-none">
                                {tx.type === 'transfer' ? '余额运转' : (tx.categoryName || tx.note || '未分类')}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {format(tx.date, 'MM/dd HH:mm')} · {tx.type === 'transfer'
                                    ? <>{tx.accountName} <span className="mx-0.5 opacity-50">→</span> {tx.targetAccountName}</>
                                    : tx.type === 'expense'
                                        ? `出金: ${tx.accountName}`
                                        : `入金: ${tx.accountName}`}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`text-sm font-semibold tabular-nums ${tx.type === 'income'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : tx.type === 'transfer'
                                ? 'text-slate-600 dark:text-slate-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                            {tx.type === 'expense' ? '-' : tx.type === 'income' ? '+' : ''}
                            {formatter.format(tx.amount)}
                        </span>
                        <button 
                            onClick={(e) => handleEdit(tx.id, e)}
                            className="p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                            title="编辑流水"
                        >
                            <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={(e) => handleDeleteClick(tx.id, e)}
                            className="p-1.5 rounded-md text-muted-foreground hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors"
                            title="删除流水"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            ))}

            {/* 编辑流水弹窗 */}
            <TransactionFormSheet 
                editTransactionId={editTxId} 
                open={isEditOpen} 
                onOpenChange={setIsEditOpen} 
            />

            {/* 删除确认对话框 */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>确认删除</DialogTitle>
                        <DialogDescription>
                            删除后将自动撤销该笔流水对账户余额的影响，此操作不可撤销。确定要删除吗？
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteOpen(false)} disabled={isDeleting}>取消</Button>
                        <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isDeleting}>
                            {isDeleting ? "删除中..." : "确认删除"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
