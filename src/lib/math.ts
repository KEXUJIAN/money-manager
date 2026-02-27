import Big from "big.js"

// 设置 big.js 的精度和舍入规则
// ROUND_HALF_UP (1) 对应四舍五入
Big.RM = 1

/**
 * 精确加法
 */
export function plus(a: number | string, b: number | string): number {
    return new Big(a || 0).plus(new Big(b || 0)).toNumber()
}

/**
 * 精确减法
 */
export function minus(a: number | string, b: number | string): number {
    return new Big(a || 0).minus(new Big(b || 0)).toNumber()
}

/**
 * 精确乘法
 */
export function times(a: number | string, b: number | string): number {
    return new Big(a || 0).times(new Big(b || 0)).toNumber()
}

/**
 * 格式化为两位小数
 * 会直接返回数字类型
 */
export function formatAmount(amount: number | string): number {
    // 强制四舍五入为两位小数
    return Number(new Big(amount || 0).toFixed(2))
}

/**
 * 格式化为两位小数，返回字符串，适合直接渲染
 */
export function formatAmountStr(amount: number | string): string {
    return new Big(amount || 0).toFixed(2)
}
