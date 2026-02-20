import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function generateId(date?: Date | number, indexOffset: number = 0): string {
    const baseDate = date ? new Date(date) : new Date()
    // 加上偏移量以区分同一毫秒/分钟的批量操作
    const timeWithOffset = new Date(baseDate.getTime() + indexOffset)
    const timePart = format(timeWithOffset, "yyyyMMddHHmmssSSS")
    // 生成 4 位随机字符
    const randomPart = Math.random().toString(36).substring(2, 6)
    return `${timePart}_${randomPart}`
}
