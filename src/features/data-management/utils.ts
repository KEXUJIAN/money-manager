import type { Transaction, Category } from "@/db"
import { LEGACY_TXT_DELIMITER, LEGACY_TXT_HEADER } from "@/lib/constants"

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
    const lines = [LEGACY_TXT_HEADER]
    const categoryMap = new Map<string, string>()

    categories.forEach(c => {
        categoryMap.set(c.id, c.name)
    })

    // 按时间升序排列（最早 → 最新）
    const sorted = [...transactions].sort((a, b) => a.date - b.date)

    sorted.forEach(tx => {
        const dateStr = formatDate(tx.date)
        const typeStr = tx.type === 'expense' ? '支出' : '收入'

        const categoryName = (tx.categoryId ? categoryMap.get(tx.categoryId) : "") || "其他"

        // 金额：支出为负数，收入为正数
        const amountSign = tx.type === 'expense' ? -1 : 1
        const amountStr = (tx.amount * amountSign).toFixed(2)

        const note = tx.note || ""

        lines.push([dateStr, typeStr, categoryName, amountStr, note].join(LEGACY_TXT_DELIMITER))
    })

    return lines.join("\n")
}
