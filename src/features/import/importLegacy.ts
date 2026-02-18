import { db } from "@/db"
import { v4 as uuidv4 } from "uuid"
import { LEGACY_TXT_DELIMITER } from "@/lib/constants"

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
 * 将解析后的交易数据导入数据库
 * 自动匹配或创建分类，使用默认账户
 */
export async function importLegacyData(transactions: ParsedTransaction[]): Promise<{
    imported: number
    categoriesCreated: number
}> {
    // 获取所有分类，建立 name+type → id 映射
    const existingCategories = await db.categories.toArray()
    const categoryMap = new Map<string, string>()
    for (const cat of existingCategories) {
        categoryMap.set(`${cat.type}:${cat.name}`, cat.id)
    }

    // 获取默认账户（第一个）
    const accounts = await db.accounts.toArray()
    if (accounts.length === 0) {
        throw new Error("请先创建至少一个账户")
    }
    const defaultAccountId = accounts[0].id

    let categoriesCreated = 0
    const now = Date.now()

    // 批量导入
    await db.transaction("rw", db.transactions, db.categories, db.accounts, async () => {
        const txRecords = []

        for (const tx of transactions) {
            const mapKey = `${tx.type}:${tx.categoryName}`

            // 如果分类不存在，自动创建
            if (!categoryMap.has(mapKey)) {
                const newCatId = uuidv4()
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

            txRecords.push({
                id: uuidv4(),
                amount: tx.amount,
                type: tx.type,
                accountId: defaultAccountId,
                categoryId: categoryMap.get(mapKey),
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
        const allTxs = await db.transactions.where("accountId").equals(defaultAccountId).toArray()
        let balance = 0
        for (const t of allTxs) {
            if (t.type === "income") balance += t.amount
            else if (t.type === "expense") balance -= t.amount
        }
        await db.accounts.update(defaultAccountId, { balance })
    })

    return { imported: transactions.length, categoriesCreated }
}
