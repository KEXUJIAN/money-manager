import { db } from "@/db"
import { LEGACY_TXT_DELIMITER } from "@/lib/constants"
import { generateId } from "@/lib/utils"
import { plus, minus } from "@/lib/math"

export interface ParsedTransaction {
    date: Date
    type: "income" | "expense"
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
        const type = typeStr === "收入" ? "income" : "expense"

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


    // 构建用于查重的 Set
    const existingTxs = await db.transactions.where("accountId").equals(accountId).toArray()
    const txSet = new Set<string>()
    for (const t of existingTxs) {
        const tDateMins = Math.floor(t.date / 60000)
        txSet.add(`${tDateMins}_${t.amount}_${t.type}_${t.categoryId}`)
    }

    let categoriesCreated = 0
    let skipped = 0
    const now = Date.now()

    // 批量导入
    await db.transaction("rw", db.transactions, db.categories, db.accounts, async () => {
        const txRecords = []

        for (let i = 0; i < transactions.length; i++) {
            const tx = transactions[i]
            const mapKey = `${tx.type}:${tx.categoryName}`

            // 如果分类不存在，自动创建
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

            const catId = categoryMap.get(mapKey)!

            // 重复检测
            if (skipDuplicates) {
                const txDateMins = Math.floor(tx.date.getTime() / 60000)
                const signature = `${txDateMins}_${tx.amount}_${tx.type}_${catId}`
                if (txSet.has(signature)) {
                    skipped++
                    continue // 跳过本条
                }
                // 加入到本次 set 内预防本次导入中有重复项
                txSet.add(signature)
            }

            txRecords.push({
                // 使用交易发生时间 + 遍历序号生成 ID 解决同一分钟排序混杂问题
                id: generateId(tx.date, i),
                amount: tx.amount,
                type: tx.type,
                accountId: accountId,
                categoryId: catId,
                date: tx.date.getTime(),
                note: tx.note || undefined,
                createdAt: now,
                updatedAt: now,
            })
        }

        // 批量写入交易
        await db.transactions.bulkAdd(txRecords)

        // 更新账户余额
        // WHY: 导入大量历史数据后重新计算余额比逐条更新高效
        const allTxs = await db.transactions.where("accountId").equals(accountId).toArray()
        let balance = 0
        for (const t of allTxs) {
            if (t.type === "income") balance = plus(balance, t.amount)
            else if (t.type === "expense") balance = minus(balance, t.amount)
        }
        await db.accounts.update(accountId, { balance })
    })

    return { imported: transactions.length - skipped, categoriesCreated }
}
