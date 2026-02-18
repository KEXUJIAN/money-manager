import type { Transaction, Category } from "@/db"

/**
 * 格式化日期为 YYYY-MM-DD HH:mm
 */
function formatDate(timestamp: number): string {
    const d = new Date(timestamp)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}`
}

/**
 * 导出交易记录为 TXT 格式
 * 格式：记账日期 \u0001 消费类别 \u0001 消费详情 \u0001 消费金额 \u0001 消费备注
 */
export function generateLegacyTxt(transactions: Transaction[], categories: Category[]): string {
    const lines = ["记账日期\u0001消费类别\u0001消费详情\u0001消费金额\u0001消费备注"]
    const categoryMap = new Map<string, string>()

    categories.forEach(c => {
        categoryMap.set(c.id, c.name)
    })

    transactions.forEach(tx => {
        const dateStr = formatDate(tx.date)
        const typeStr = tx.type === 'expense' ? '支出' : (tx.type === 'income' ? '收入' : '转账')

        // 假如是转账，暂时按支出处理或跳过？旧格式似乎没有转账。
        // Milestone 0.1 legacy import handles income/expense. Transfer might not be supported in legacy format.
        // We will map transfer to '支出' for now or '转账' if we update the parser, but let's stick to income/expense if possible.
        // Actually, let's export it as is.

        const categoryName = (tx.categoryId ? categoryMap.get(tx.categoryId) : "") || "其他"

        // 金额：支出为负数，收入为正数
        const amountSign = tx.type === 'expense' ? -1 : 1
        const amountStr = (tx.amount * amountSign).toFixed(2)

        const note = tx.note || ""

        // 使用 Unicode SOH (\u0001) 分隔
        lines.push(`${dateStr}\u0001${typeStr}\u0001${categoryName}\u0001${amountStr}\u0001${note}`)
    })

    return lines.join("\n")
}
