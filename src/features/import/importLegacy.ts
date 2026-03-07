import { db } from "@/db"
import { LEGACY_TXT_DELIMITER } from "@/lib/constants"
import { generateId } from "@/lib/utils"
import { plus, minus } from "@/lib/math"

export interface ParsedTransaction {
    date: Date
    type: "income" | "expense" | "transfer"
    categoryName: string
    amount: number  // 正数
    note: string
}

/**
 * 解析历史账单 TXT 文件
 * 格式：记账日期 \u0001 消费类别 \u0001 消费详情 \u0001 消费金额 \u0001 消费备注
 * 例如：2017-11-01 00:01 \u0001 支出 \u0001 餐饮 \u0001 -3.00 \u0001 早饭，花呗
 */
export function parseLegacyTxt(text: string): ParsedTransaction[] {
    const lines = text.trim().split("\n")
    const results: ParsedTransaction[] = []

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue

        // 跳过表头
        if (line.startsWith("记账日期")) continue

        const parts = line.split(LEGACY_TXT_DELIMITER).map(s => s.trim())
        if (parts.length < 4) {
            console.warn(`跳过第 ${i + 1} 行（列数不足）:`, line)
            continue
        }

        const [dateStr, typeStr, categoryName, amountStr, ...noteParts] = parts
        const note = noteParts.join(" ").trim()

        // 解析日期
        const date = new Date(dateStr)
        if (isNaN(date.getTime())) {
            console.warn(`跳过第 ${i + 1} 行（日期无效）:`, dateStr)
            continue
        }

        // 解析类型
        let type: "income" | "expense" | "transfer" = "expense"
        if (typeStr.includes("收入")) type = "income"
        else if (typeStr.includes("转账")) type = "transfer"

        // 解析金额（取绝对值）
        const amount = Math.abs(parseFloat(amountStr))
        if (isNaN(amount) || amount === 0) {
            console.warn(`跳过第 ${i + 1} 行（金额无效）:`, amountStr)
            continue
        }

        results.push({ date, type, categoryName, amount, note })
    }

    return results
}

/**
 * 预检重复记录数
 */
export async function checkTxtDuplicates(
    transactions: ParsedTransaction[],
    accountId: string
): Promise<number> {
    const existingCategories = await db.categories.toArray()
    const categoryMap = new Map<string, string>()
    for (const cat of existingCategories) {
        categoryMap.set(`${cat.type}:${cat.name}`, cat.id)
    }

    const existingTxs = await db.transactions.where("accountId").equals(accountId).toArray()
    const txSet = new Set<string>()
    for (const t of existingTxs) {
        // 分钟级特征匹配签名: 日期(降至分钟)_金额_类型_分类id
        const tDateMins = Math.floor(t.date / 60000)
        txSet.add(`${tDateMins}_${t.amount}_${t.type}_${t.categoryId}`)
    }

    let duplicates = 0
    for (const tx of transactions) {
        const catKey = `${tx.type}:${tx.categoryName}`
        const catId = categoryMap.get(catKey)
        if (catId) {
            const txDateMins = Math.floor(tx.date.getTime() / 60000)
            const signature = `${txDateMins}_${tx.amount}_${tx.type}_${catId}`
            if (txSet.has(signature)) {
                duplicates++
            }
        }
    }
    return duplicates
}

/**
 * 将解析后的交易数据导入数据库
 * 自动匹配或创建分类，传入指定的目标账户 ID
 */
export async function importLegacyData(
    transactions: ParsedTransaction[],
    accountId: string,
    skipDuplicates: boolean = false
): Promise<{
    imported: number
    categoriesCreated: number
}> {
    // 获取所有分类，建立 name+type → id 映射
    const existingCategories = await db.categories.toArray()
    const categoryMap = new Map<string, string>()
    for (const cat of existingCategories) {
        categoryMap.set(`${cat.type}:${cat.name}`, cat.id)
    }

    // 我们需要维护一个自动生成的转账源账户（比如："未分配储蓄"）
    let unallocatedSrcAccount = await db.accounts.where("name").equals("未分配储蓄").first()

    // 我们需要建立名字到账号名映射来为转账指定 TargetAccount
    const existingAccounts = await db.accounts.toArray()
    const accountMap = new Map<string, string>()
    for (const acc of existingAccounts) {
        accountMap.set(acc.name, acc.id)
    }


    // 构建用于查重的 Set (仅对当前操作 accountId, 要注意 transfer 现在可能有特定的签名机制)
    // 为了稳妥，单边历史查重暂仍然针对原逻辑
    const existingTxs = await db.transactions.where("accountId").equals(accountId).toArray()
    const txSet = new Set<string>()
    for (const t of existingTxs) {
        const tDateMins = Math.floor(t.date / 60000)
        txSet.add(`${tDateMins}_${t.amount}_${t.type}_${t.categoryId || ''}`)
    }

    let categoriesCreated = 0
    let skipped = 0
    const now = Date.now()

    const affectedAccountIds = new Set<string>()
    affectedAccountIds.add(accountId)

    // 批量导入
    await db.transaction("rw", db.transactions, db.categories, db.accounts, async () => {
        const txRecords: import("@/db").Transaction[] = []

        // 保证基础转出账户的存在
        if (!unallocatedSrcAccount && transactions.some(t => t.type === 'transfer')) {
            unallocatedSrcAccount = {
                id: generateId(),
                name: "未分配储蓄",
                type: "cash",
                balance: 0,
                balanceOffset: 0,
                currency: "CNY",
                createdAt: now,
                updatedAt: now,
            }
            await db.accounts.add(unallocatedSrcAccount)
            accountMap.set(unallocatedSrcAccount.name, unallocatedSrcAccount.id)
            affectedAccountIds.add(unallocatedSrcAccount.id)
        }

        for (let i = 0; i < transactions.length; i++) {
            const tx = transactions[i]

            // 对 transfer 来说，所谓的 categoryName 实际上是 targetAccountName
            let actualCatId = undefined;
            let actualTargetAccountId = undefined;
            let actualSourceAccountId = accountId;

            if (tx.type === "transfer") {
                const targetAccountName = tx.note?.trim() || tx.categoryName;
                // 如果目标账号不存在，则自动创建该信用卡/目标卡
                if (!accountMap.has(targetAccountName)) {
                    // 推断账户类型
                    let accType: "cash" | "bank" | "alipay" | "wechat" | "credit_card" | "other" = "other"
                    if (targetAccountName.includes("微信")) accType = "wechat"
                    else if (targetAccountName.includes("支付宝")) accType = "alipay"
                    else if (/(信|卡|花呗|白条)/.test(targetAccountName)) accType = "credit_card"
                    else if (/(银|行|储蓄)/.test(targetAccountName)) accType = "bank"

                    const newTargetAccId = generateId(now, i + 99999)
                    await db.accounts.add({
                        id: newTargetAccId,
                        name: targetAccountName,
                        type: accType,
                        balance: 0,
                        balanceOffset: 0,
                        currency: "CNY",
                        createdAt: now,
                        updatedAt: now,
                    })
                    accountMap.set(targetAccountName, newTargetAccId)
                }
                actualTargetAccountId = accountMap.get(targetAccountName)!
                actualSourceAccountId = unallocatedSrcAccount!.id
                affectedAccountIds.add(actualTargetAccountId)
                affectedAccountIds.add(actualSourceAccountId)
            } else {
                // 正常的 Income/Expense 才有真正的分类
                const mapKey = `${tx.type}:${tx.categoryName}`
                if (!categoryMap.has(mapKey)) {
                    const newCatId = generateId(now, categoriesCreated)
                    await db.categories.add({
                        id: newCatId,
                        name: tx.categoryName,
                        type: tx.type,
                        createdAt: now,
                        updatedAt: now,
                    })
                    categoryMap.set(mapKey, newCatId)
                    categoriesCreated++
                }
                actualCatId = categoryMap.get(mapKey)!
            }

            // 重复检测
            if (skipDuplicates && tx.type !== 'transfer') {
                const txDateMins = Math.floor(tx.date.getTime() / 60000)
                const signature = `${txDateMins}_${tx.amount}_${tx.type}_${actualCatId || ''}`
                if (txSet.has(signature)) {
                    skipped++
                    continue // 跳过本条
                }
                txSet.add(signature)
            }

            txRecords.push({
                id: generateId(tx.date, i),
                amount: tx.amount,
                type: tx.type,
                accountId: actualSourceAccountId,
                transferToAccountId: actualTargetAccountId,
                categoryId: actualCatId,
                date: tx.date.getTime(),
                note: tx.note || undefined,
                createdAt: now,
                updatedAt: now,
            })
        }

        // 批量写入交易
        await db.transactions.bulkAdd(txRecords as any)

        // 全面重算被波及账户的余额
        // 真实余额 = 流水叠加 + balanceOffset
        for (const accId of affectedAccountIds) {
            const acc = await db.accounts.get(accId)
            if (!acc) continue;

            // 找该账户作为出金源的所有单单
            const outTxs = await db.transactions.where("accountId").equals(accId).toArray()
            // 找该账户作为收金目标的所有专有转账单
            // 注意由于并未直接写死针对 `transferToAccountId` 索引全表获取方法，可以使用过滤器
            const inTransferTxs = await db.transactions.filter(t => t.type === 'transfer' && t.transferToAccountId === accId).toArray()

            let calculatedBalance = acc.balanceOffset || 0

            for (const t of outTxs) {
                if (t.type === "income") calculatedBalance = plus(calculatedBalance, t.amount)
                else if (t.type === "expense") calculatedBalance = minus(calculatedBalance, t.amount)
                else if (t.type === "transfer") calculatedBalance = minus(calculatedBalance, t.amount) // 作为转出方减去
            }
            for (const t of inTransferTxs) {
                calculatedBalance = plus(calculatedBalance, t.amount) // 作为转入方增加
            }

            await db.accounts.update(accId, { balance: calculatedBalance })
        }
    })

    return { imported: transactions.length - skipped, categoriesCreated }
}
