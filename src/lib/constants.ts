/**
 * Legacy TXT 文件的字段分隔符
 * 格式为 " \u0001 "（空格 + SOH + 空格）
 */
export const LEGACY_TXT_DELIMITER = " \u0001 "

/**
 * Legacy TXT 表头
 */
export const LEGACY_TXT_HEADER = `记账日期${LEGACY_TXT_DELIMITER}消费类别${LEGACY_TXT_DELIMITER}消费详情${LEGACY_TXT_DELIMITER}消费金额${LEGACY_TXT_DELIMITER}消费备注`
