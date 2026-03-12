import { db } from "@/db"
import { plus, minus } from "@/lib/math"

/**
 * 删除单条流水记录，并在 Dexie 事务内撤销其对账户余额的影响。
 * 所有操作包裹在一个原子事务中，保证数据一致性。
 */
export async function deleteTransaction(transactionId: string) {
    await db.transaction('rw', db.transactions, db.accounts, async () => {
        const txn = await db.transactions.get(transactionId)
        if (!txn) return

        // 撤销出账/所属账户的余额影响
        const account = await db.accounts.get(txn.accountId)
        if (account) {
            let revertedBalance = account.balance
            if (txn.type === 'expense' || txn.type === 'transfer') {
                revertedBalance = plus(account.balance, txn.amount) // 原来扣的加回来
            } else if (txn.type === 'income') {
                revertedBalance = minus(account.balance, txn.amount) // 原来加的减掉
            }
            await db.accounts.update(txn.accountId, { balance: revertedBalance })
        }

        // 撤销转入账户的余额影响（如果是转账）
        if (txn.type === 'transfer' && txn.transferToAccountId) {
            const toAccount = await db.accounts.get(txn.transferToAccountId)
            if (toAccount) {
                await db.accounts.update(txn.transferToAccountId, {
                    balance: minus(toAccount.balance, txn.amount) // 原来转入加的减掉
                })
            }
        }

        // 删除流水记录
        await db.transactions.delete(transactionId)
    })
}
