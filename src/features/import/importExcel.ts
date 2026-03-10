import { db } from "@/db"
import { generateId } from "@/lib/utils"

export type ParsedExcelRow = {
    "记账日期": string;
    "收支类型": string;
    "分类": string;
    "金额": number;
    "出金账户": string;
    "入金账户": string;
    "备注": string;
    "[系统映射_流水ID]"?: string;
    "[系统映射_分类ID]"?: string;
    "[系统映射_出金账户ID]"?: string;
    "[系统映射_入金账户ID]"?: string;
}

export async function importExcelData(rows: ParsedExcelRow[], skipDuplicates: boolean = true) {
    let imported = 0
    let categoriesCreated = 0
    let accountsCreated = 0

    // 预加热缓存表，减少查询次数
    const allCategories = await db.categories.toArray()
    const categoryMap = new Map(allCategories.map(c => [c.id, c])) // id -> category
    const categoryNameMap = new Map(allCategories.map(c => [c.name, c])) // name -> category

    const allAccounts = await db.accounts.toArray()
    const accountMap = new Map(allAccounts.map(a => [a.id, a])) // id -> account
    const accountNameMap = new Map(allAccounts.map(a => [a.name, a])) // name -> account

    // 缓存刚才新建的新账户/分类，防止同一批次内重复创建
    const newCategoriesCache = new Map<string, string>() // name -> new mapped id
    const newAccountsCache = new Map<string, string>() // name -> new mapped id

    const getOrCreateCategory = async (name: string, type: 'expense' | 'income', predefinedId?: string): Promise<string> => {
        if (!name) return "" // 转账没有分类

        // 1. 如果带有原生 ID 且库里有该 ID，直接沿用
        if (predefinedId && categoryMap.has(predefinedId)) {
            return predefinedId
        }

        // 2. 按名称找现存的
        if (categoryNameMap.has(name)) {
            return categoryNameMap.get(name)!.id
        }

        // 3. 检查本批次是不是刚建过同名的
        if (newCategoriesCache.has(name)) {
            return newCategoriesCache.get(name)!
        }

        // 4. 新建
        const newId = predefinedId || generateId()
        const now = Date.now()
        await db.categories.add({
            id: newId,
            name,
            type,
            isBuiltin: false,
            createdAt: now,
            updatedAt: now
        })
        newCategoriesCache.set(name, newId)
        categoriesCreated++
        return newId
    }

    const getOrCreateAccount = async (name: string, predefinedId?: string): Promise<string> => {
        if (!name) return ""

        if (predefinedId && accountMap.has(predefinedId)) {
            return predefinedId
        }
        if (accountNameMap.has(name)) {
            return accountNameMap.get(name)!.id
        }
        if (newAccountsCache.has(name)) {
            return newAccountsCache.get(name)!
        }

        const newId = predefinedId || generateId()
        const now = Date.now()
        await db.accounts.add({
            id: newId,
            name,
            type: "cash", // 默认随便给个类型，用户可以自己改
            balance: 0,
            currency: "CNY",
            icon: "wallet",
            color: "gray",
            createdAt: now,
            updatedAt: now
        })
        newAccountsCache.set(name, newId)
        accountsCreated++
        return newId
    }

    // 批量导入
    await db.transaction("rw", db.transactions, db.categories, db.accounts, async () => {
        const transactionsToPut = []

        for (const row of rows) {
            let type: 'expense' | 'income' | 'transfer'
            if (row.收支类型 === '支出') type = 'expense'
            else if (row.收支类型 === '收入') type = 'income'
            else if (row.收支类型 === '转账') type = 'transfer'
            else continue // 无法识别直接跳过

            // 解析时间和金额
            let timestamp: number
            if (typeof row.记账日期 === 'number') {
                // 如果是 Excel 序列号
                const utc_days = Math.floor(row.记账日期 - 25569)
                const utc_value = utc_days * 86400
                const date_info = new Date(utc_value * 1000)
                const fractional_day = row.记账日期 - Math.floor(row.记账日期) + 0.0000001
                let total_seconds = Math.floor(86400 * fractional_day)
                const hours = Math.floor(total_seconds / 3600); total_seconds -= hours * 3600
                const minutes = Math.floor(total_seconds / 60); total_seconds -= Math.floor(minutes * 60)
                date_info.setHours(hours, minutes, total_seconds)
                timestamp = date_info.getTime()
            } else {
                timestamp = new Date(row.记账日期).getTime()
            }
            if (isNaN(timestamp)) continue

            const amount = Math.abs(Number(row.金额))
            if (isNaN(amount)) continue

            // 处理分类和账户的外键 ID
            const categoryId = await getOrCreateCategory(
                row.分类,
                type === 'transfer' ? 'expense' : type,
                row['[系统映射_分类ID]']
            )

            const accountId = await getOrCreateAccount(
                row.出金账户 || row.入金账户, // 容纳单边账户
                row['[系统映射_出金账户ID]'] || row['[系统映射_入金账户ID]']
            )

            let transferToAccountId = undefined
            if (type === 'transfer' && row.入金账户 && row.出金账户) {
                // 出入金分别获取
                transferToAccountId = await getOrCreateAccount(row.入金账户, row['[系统映射_入金账户ID]'])
            }

            if (!accountId) continue // 账户缺失无法记账

            const txId = row['[系统映射_流水ID]'] || generateId()

            if (skipDuplicates && !row['[系统映射_流水ID]']) {
                // 如果是外来数据去重 (日期在一分钟内，金额一样，账户分类都一样)
                const isDup = await db.transactions
                    .where('date').between(timestamp - 60000, timestamp + 60000)
                    .and(t => t.amount === amount && t.type === type && t.accountId === accountId && t.categoryId === categoryId)
                    .first()
                if (isDup) continue
            } else if (skipDuplicates && row['[系统映射_流水ID]']) {
                // 带有原始 ID 的同名写入通常覆盖/存在即跳过。我们使用覆盖写入来支持用户侧的修改效果。
                // 也就是 db.put
            }

            transactionsToPut.push({
                id: txId,
                type,
                amount,
                date: timestamp,
                categoryId,
                accountId,
                transferToAccountId,
                note: row.备注 || "",
                createdAt: timestamp,
                updatedAt: Date.now()
            })
            imported++
        }

        // 用 put 支持带主键的无缝合并覆盖
        await db.transactions.bulkPut(transactionsToPut)
    })

    return { imported, categoriesCreated, accountsCreated }
}
