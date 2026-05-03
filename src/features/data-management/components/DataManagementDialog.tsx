import { useState, useRef, useMemo } from "react"
import { db } from "@/db"
import { seedDatabase } from "@/db/seed"
import { Download, Upload, Trash2, FileText, Database, AlertTriangle } from "lucide-react"
import { LEGACY_TXT_DELIMITER, LEGACY_TXT_HEADER } from "@/lib/constants"
import { toast } from "sonner"
import { useLiveQuery } from "dexie-react-hooks"
import { generateId } from "@/lib/utils"
import { saveFile } from "@/lib/fileService"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ConfirmationModal } from "@/components/ui/confirmation-modal"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { parseLegacyTxt, importLegacyData, checkTxtDuplicates } from "@/features/import/importLegacy"
import { importExcelData, type ParsedExcelRow } from "@/features/import/importExcel"
import { LoadingMask } from "@/components/ui/loading-mask"

export function DataManagementDialog() {
    const [open, setOpen] = useState(false)
    const [importing, setImporting] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [clearConfirmOpen, setClearConfirmOpen] = useState(false)
    const [clearAccountConfirmOpen, setClearAccountConfirmOpen] = useState(false)
    const [selectedAccountToClear, setSelectedAccountToClear] = useState("")
    const [jsonImportConfirmOpen, setJsonImportConfirmOpen] = useState(false)
    const [txtImportConfirmOpen, setTxtImportConfirmOpen] = useState(false)
    const [txtDuplicateConfirmOpen, setTxtDuplicateConfirmOpen] = useState(false)
    const [txtDuplicateCount, setTxtDuplicateCount] = useState(0)

    // Excel Import States
    const [excelDuplicateConfirmOpen, setExcelDuplicateConfirmOpen] = useState(false)
    const pendingExcelParsed = useRef<ParsedExcelRow[] | null>(null)

    const [selectedAccountId, setSelectedAccountId] = useState("")
    const pendingJsonData = useRef<ReturnType<typeof JSON.parse> | null>(null) // any 理由：JSON.parse 返回值即为 any
    const pendingTxtParsed = useRef<Awaited<ReturnType<typeof parseLegacyTxt>> | null>(null)
    const pendingTxtAccountId = useRef<string | null>(null)

    const accounts = useLiveQuery(() => db.accounts.toArray()) || []
    const accountOptions = useMemo(
        () => accounts.map(a => ({ value: a.id, label: a.name })),
        [accounts]
    )

    // ---- 数据导出 (JSON) ----
    async function exportJson() {
        try {
            setIsProcessing(true)
            const accounts = await db.accounts.toArray()
            const categoriesData = await db.categories.toArray()
            const transactions = await db.transactions.toArray()

            const data = {
                version: "1.0",
                exportedAt: new Date().toISOString(),
                accounts,
                categories: categoriesData,
                transactions,
            }

            const content = JSON.stringify(data, null, 2)
            const filename = `money-manager-backup-${new Date().toISOString().slice(0, 10)}.json`

            const saved = await saveFile(filename, content, "json")
            if (saved) toast.success("导出 JSON 成功")
        } catch (error) {
            console.error("导出失败:", error)
            toast.error("导出失败，请重试")
        } finally {
            setIsProcessing(false)
        }
    }

    // ---- 数据导出 (TXT) ----
    async function exportTxt() {
        try {
            setIsProcessing(true)
            const transactions = await db.transactions.toArray()
            // 按时间升序排列（最早 → 最新）
            transactions.sort((a, b) => a.date - b.date)
            const categories = await db.categories.toArray()
            const accounts = await db.accounts.toArray()

            const lines = [LEGACY_TXT_HEADER]
            const categoryMap = new Map()
            categories.forEach(c => categoryMap.set(c.id, c.name))
            const accountMap = new Map()
            accounts.forEach(a => accountMap.set(a.id, a.name))

            // 格式化日期 YYYY-MM-DD HH:mm
            const fmtDate = (ts: number) => {
                const d = new Date(ts)
                const Y = d.getFullYear()
                const M = String(d.getMonth() + 1).padStart(2, '0')
                const D = String(d.getDate()).padStart(2, '0')
                const H = String(d.getHours()).padStart(2, '0')
                const m = String(d.getMinutes()).padStart(2, '0')
                return `${Y}-${M}-${D} ${H}:${m}`
            }

            transactions.forEach(tx => {
                const dateStr = fmtDate(tx.date)
                const typeStr = tx.type === 'expense' ? '支出' : tx.type === 'income' ? '收入' : '转账'
                const catName = tx.type === 'transfer' ? '' : (categoryMap.get(tx.categoryId) || "其他")
                // 支出为负数，收入和转账为正数
                const amount = tx.type === 'expense' ? -tx.amount : tx.amount
                const fromAccountName = accountMap.get(tx.accountId) || "未知账户"
                const toAccountName = tx.type === 'transfer' && tx.transferToAccountId ? (accountMap.get(tx.transferToAccountId) || "未知账户") : ""

                // 为了兼容经典的 5 列 TXT 格式，将账号信息打包写入备注
                let finalNote = tx.note || ""
                if (tx.type === 'transfer') {
                    finalNote = `[出金:${fromAccountName} 入金:${toAccountName}] ${finalNote}`.trim()
                } else {
                    finalNote = `[账户:${fromAccountName}] ${finalNote}`.trim()
                }

                lines.push([dateStr, typeStr, catName, amount.toFixed(2), finalNote].join(LEGACY_TXT_DELIMITER))
            })

            const content = lines.join("\n")
            const filename = `money-manager-export-${new Date().toISOString().slice(0, 10)}.txt`
            
            const saved = await saveFile(filename, content, "txt")
            if (saved) toast.success("导出 TXT 成功")

        } catch (error) {
            console.error("TXT 导出失败:", error)
            toast.error("导出失败，请重试")
        } finally {
            setIsProcessing(false)
        }
    }

    // ---- 数据导出 (XLSX) ----
    async function exportXlsx() {
        try {
            setIsProcessing(true)
            const XLSX = await import("xlsx")
            const transactions = await db.transactions.toArray()
            transactions.sort((a, b) => a.date - b.date)
            const categories = await db.categories.toArray()
            const accounts = await db.accounts.toArray()

            const categoryMap = new Map()
            categories.forEach(c => categoryMap.set(c.id, c.name))
            const accountMap = new Map()
            accounts.forEach(a => accountMap.set(a.id, a.name))

            const fmtDate = (ts: number) => {
                const d = new Date(ts)
                const Y = d.getFullYear()
                const M = String(d.getMonth() + 1).padStart(2, '0')
                const D = String(d.getDate()).padStart(2, '0')
                const H = String(d.getHours()).padStart(2, '0')
                const m = String(d.getMinutes()).padStart(2, '0')
                return `${Y}-${M}-${D} ${H}:${m}`
            }

            // 构建带有特定单元格类型的表单数据结构避免科学计数法
            const data = transactions.map(tx => {
                const amountSign = tx.type === 'expense' ? -1 : 1

                // 计算准确的账户流向归属
                let outAccount = ""
                let inAccount = ""
                const baseAccountName = accountMap.get(tx.accountId) || "未知账户"

                if (tx.type === 'expense') {
                    outAccount = baseAccountName
                } else if (tx.type === 'income') {
                    inAccount = baseAccountName
                } else if (tx.type === 'transfer') {
                    outAccount = baseAccountName
                    inAccount = tx.transferToAccountId ? (accountMap.get(tx.transferToAccountId) || "未知账户") : ""
                }

                return {
                    "记账日期": { t: 's', v: fmtDate(tx.date) },
                    "收支类型": { t: 's', v: tx.type === 'expense' ? '支出' : tx.type === 'income' ? '收入' : '转账' },
                    "分类": { t: 's', v: tx.type === 'transfer' ? '' : (categoryMap.get(tx.categoryId) || "其他") },
                    "金额": { t: 'n', v: Number((tx.amount * amountSign).toFixed(2)) },
                    "出金账户": { t: 's', v: outAccount },
                    "入金账户": { t: 's', v: inAccount },
                    "备注": { t: 's', v: tx.note || "" },
                    "[系统映射_流水ID]": { t: 's', v: tx.id },
                    "[系统映射_分类ID]": { t: 's', v: tx.categoryId },
                    "[系统映射_出金账户ID]": { t: 's', v: tx.type === 'income' ? "" : tx.accountId },
                    "[系统映射_入金账户ID]": { t: 's', v: tx.type === 'expense' ? "" : (tx.type === 'income' ? tx.accountId : (tx.transferToAccountId || "")) },
                }
            })

            const worksheet = XLSX.utils.json_to_sheet(data, {
                header: ["记账日期", "收支类型", "分类", "金额", "出金账户", "入金账户", "备注", "[系统映射_流水ID]", "[系统映射_分类ID]", "[系统映射_出金账户ID]", "[系统映射_入金账户ID]"],
                skipHeader: false
            })

            // 设置列宽 (隐藏最后4列系统映射ID)
            worksheet['!cols'] = [
                { wch: 18 }, // 日期
                { wch: 8 },  // 类型
                { wch: 15 }, // 分类
                { wch: 12 }, // 金额
                { wch: 15 }, // 出金账户
                { wch: 15 }, // 入金账户
                { wch: 30 }, // 备注
                { hidden: true }, // [系统映射_流水ID]
                { hidden: true }, // [系统映射_分类ID]
                { hidden: true }, // [系统映射_出金账户ID]
                { hidden: true }, // [系统映射_入金账户ID]
            ]

            const workbook = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(workbook, worksheet, "账单数据")

            const filename = `money-manager-export-${new Date().toISOString().slice(0, 10)}.xlsx`
            const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
            
            const saved = await saveFile(filename, new Uint8Array(wbout), "xlsx")
            if (saved) toast.success("导出 XLSX 成功")
        } catch (error) {
            console.error("XLSX 导出失败:", error)
            toast.error("导出 XLSX 失败，请重试")
        } finally {
            setIsProcessing(false)
        }
    }

    // ---- 数据导入 (JSON) ----
    async function importJson() {
        const input = document.createElement("input")
        input.type = "file"
        input.accept = ".json"
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0]
            if (!file) return

            try {
                const text = await file.text()
                const data = JSON.parse(text)

                if (!data.version || !data.accounts || !data.transactions) {
                    toast.error("无效的备份文件格式")
                    return
                }

                pendingJsonData.current = data
                setJsonImportConfirmOpen(true)
            } catch (error) {
                console.error("导入失败:", error)
                toast.error("导入失败，请检查文件格式")
            }
        }
        input.click()
    }

    async function doJsonImport() {
        const data = pendingJsonData.current
        if (!data) return
        try {
            setIsProcessing(true)
            await db.transaction("rw", db.accounts, db.categories, db.transactions, async () => {
                await db.accounts.clear()
                await db.categories.clear()
                await db.transactions.clear()

                if (data.accounts?.length) await db.accounts.bulkAdd(data.accounts)
                if (data.categories?.length) await db.categories.bulkAdd(data.categories)
                if (data.transactions?.length) await db.transactions.bulkAdd(data.transactions)
            })

            toast.success("导入成功！")
            setOpen(false)
        } catch (error) {
            console.error("导入失败:", error)
            toast.error("导入失败，请检查文件格式")
        } finally {
            setIsProcessing(false)
            pendingJsonData.current = null
        }
    }

    // ---- 导入报表 (XLSX) ----
    async function importXlsx() {
        const input = document.createElement("input")
        input.type = "file"
        input.accept = ".xlsx, .xls"
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0]
            if (!file) return

            try {
                setImporting(true)
                const XLSX = await import("xlsx")
                const data = await file.arrayBuffer()
                const workbook = XLSX.read(data, { type: 'array' })

                const firstSheetName = workbook.SheetNames[0]
                const worksheet = workbook.Sheets[firstSheetName]

                // 解析时确认为 ParsedExcelRow 的结构
                const parsed = XLSX.utils.sheet_to_json<ParsedExcelRow>(worksheet)

                if (parsed.length === 0) {
                    toast.error("未找到有效的交易记录，请检查文件内容")
                    return
                }

                pendingExcelParsed.current = parsed
                // 简化流程，直接询问是否跳过重复项（复用之前去重的提醒文案范式）
                setExcelDuplicateConfirmOpen(true)
            } catch (error) {
                console.error("Excel 导入失败:", error)
                toast.error("导入失败：" + (error instanceof Error ? error.message : "未知错误"))
            } finally {
                setImporting(false)
            }
        }
        input.click()
    }

    async function executeExcelImport(skipDuplicates: boolean) {
        const parsed = pendingExcelParsed.current
        if (!parsed) return
        try {
            setImporting(true)
            const result = await importExcelData(parsed, skipDuplicates)
            toast.success(`导入完成！✅ 导入/更新 ${result.imported} 条交易 (有 ID 全量覆盖)。📂 补充 ${result.categoriesCreated} 个分类，💳 补充 ${result.accountsCreated} 个账户。`)
            setOpen(false)
        } catch (error) {
            console.error("Excel 导入执行失败:", error)
            toast.error("导入失败：" + (error instanceof Error ? error.message : "未知错误"))
        } finally {
            setImporting(false)
            setExcelDuplicateConfirmOpen(false)
            pendingExcelParsed.current = null
        }
    }

    // ---- 导入历史账单 (TXT) ----
    async function importTxt() {
        const input = document.createElement("input")
        input.type = "file"
        input.accept = ".txt"
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0]
            if (!file) return

            try {
                setImporting(true)
                const text = await file.text()
                const parsed = parseLegacyTxt(text)

                if (parsed.length === 0) {
                    toast.error("未找到有效的交易记录，请检查文件格式")
                    return
                }

                pendingTxtParsed.current = parsed
                setTxtImportConfirmOpen(true)
            } catch (error) {
                console.error("历史账单导入失败:", error)
                toast.error("导入失败：" + (error instanceof Error ? error.message : "未知错误"))
            } finally {
                setImporting(false)
            }
        }
        input.click()
    }
    async function preCheckTxtImport() {
        const parsed = pendingTxtParsed.current
        if (!parsed) return
        try {
            setImporting(true)

            let targetAccountId = selectedAccountId

            // 如果没有账户，自动创建默认账户
            if (accounts.length === 0 || !targetAccountId) {
                const newId = generateId()
                const now = Date.now()
                await db.accounts.add({
                    id: newId,
                    name: "默认账户",
                    type: "cash",
                    balance: 0,
                    currency: "CNY",
                    icon: "wallet",
                    color: "green",
                    createdAt: now,
                    updatedAt: now,
                })
                targetAccountId = newId
                toast.info("已自动创建默认账户")
            }

            pendingTxtAccountId.current = targetAccountId
            const dupCount = await checkTxtDuplicates(parsed, targetAccountId)

            if (dupCount > 0) {
                setTxtDuplicateCount(dupCount)
                setTxtImportConfirmOpen(false)     // 关闭上一个弹窗
                setTxtDuplicateConfirmOpen(true)   // 打开排重弹窗
                setImporting(false)
                return
            }

            // 无重复情况下直接执行导入
            await executeTxtImport(false)
        } catch (error) {
            console.error("历史账单导入前置检查失败:", error)
            toast.error("导入失败：" + (error instanceof Error ? error.message : "未知错误"))
            setImporting(false)
            pendingTxtParsed.current = null
            pendingTxtAccountId.current = null
        }
    }

    async function executeTxtImport(skipDuplicates: boolean) {
        const parsed = pendingTxtParsed.current
        const targetAccountId = pendingTxtAccountId.current || selectedAccountId
        if (!parsed || !targetAccountId) return
        try {
            setImporting(true)
            const result = await importLegacyData(parsed, targetAccountId, skipDuplicates)
            toast.success(`导入完成！✅ 导入 ${result.imported} 条交易，📂 新建 ${result.categoriesCreated} 个分类。${skipDuplicates ? `(已过滤 ${txtDuplicateCount} 条重复项)` : ""}`)
            setOpen(false)
        } catch (error) {
            console.error("历史账单导入执行失败:", error)
            toast.error("导入失败：" + (error instanceof Error ? error.message : "未知错误"))
        } finally {
            setImporting(false)
            setTxtDuplicateConfirmOpen(false)
            pendingTxtParsed.current = null
            pendingTxtAccountId.current = null
        }
    }

    // ---- 清空数据 ----
    async function clearAllData() {
        try {
            setIsProcessing(true)
            await db.transaction("rw", db.accounts, db.categories, db.transactions, async () => {
                await db.accounts.clear()
                // 不再特权保留内置分类，彻底杀掉所有分类数据以防老版本数据幽灵作怪
                await db.categories.clear()
                await db.transactions.clear()

                // 光速利用强健的初始化逻辑重新注入新鲜的、合法主键的默认数据
                await seedDatabase()
            })
            toast.success("数据已重置清空，系统框架已重新初始化")
            setOpen(false)
        } catch (error) {
            console.error("清空失败:", error)
            toast.error("清空失败，请重试")
        } finally {
            setIsProcessing(false)
            setClearConfirmOpen(false)
        }
    }

    async function clearAccountData() {
        if (!selectedAccountToClear) return
        try {
            setIsProcessing(true)
            await db.transaction("rw", db.transactions, db.accounts, async () => {
                // 1. 查找所有该账户参与的流水（作为出金或入金方）
                const outTxs = await db.transactions.where("accountId").equals(selectedAccountToClear).toArray()
                const inTxs = await db.transactions.where("transferToAccountId").equals(selectedAccountToClear).toArray()

                // 去重合并所有涉及的流水 (防止同一笔流水被计算两次)
                const txMap = new Map()
                outTxs.forEach(tx => txMap.set(tx.id, tx))
                inTxs.forEach(tx => txMap.set(tx.id, tx))
                const allRelatedTxs = Array.from(txMap.values())

                // 2. 统计其他受影响关联账户的余额回退量
                const accountBalanceDiffs: Record<string, number> = {}

                allRelatedTxs.forEach(tx => {
                    if (tx.type === 'income') {
                        // 收入：当时加了钱，现在删掉这笔流水等于要扣掉
                        if (!accountBalanceDiffs[tx.accountId]) accountBalanceDiffs[tx.accountId] = 0
                        accountBalanceDiffs[tx.accountId] -= tx.amount
                    } else if (tx.type === 'expense') {
                        // 支出：当时扣了钱，现在删掉等于要补回
                        if (!accountBalanceDiffs[tx.accountId]) accountBalanceDiffs[tx.accountId] = 0
                        accountBalanceDiffs[tx.accountId] += tx.amount
                    } else if (tx.type === 'transfer') {
                        // 转账：当时来源扣钱，目标加钱。现在逆向还原
                        if (!accountBalanceDiffs[tx.accountId]) accountBalanceDiffs[tx.accountId] = 0
                        accountBalanceDiffs[tx.accountId] += tx.amount

                        if (tx.transferToAccountId) {
                            if (!accountBalanceDiffs[tx.transferToAccountId]) accountBalanceDiffs[tx.transferToAccountId] = 0
                            accountBalanceDiffs[tx.transferToAccountId] -= tx.amount
                        }
                    }
                })

                // 3. 批量回退更新非主清空账户的余额
                const allAccountIdsToUpdate = Object.keys(accountBalanceDiffs)
                for (const actId of allAccountIdsToUpdate) {
                    // 跳过这个正在被“全面清空重置”的主角账户
                    if (actId === selectedAccountToClear) continue

                    const acc = await db.accounts.get(actId)
                    if (acc) {
                        // 回滚补差值 (由于 JS 浮点问题，最好截取固定精度)
                        const newBalance = Number((acc.balance + accountBalanceDiffs[actId]).toFixed(2))
                        await db.accounts.update(actId, { balance: newBalance })
                    }
                }

                // 4. 清空流水的真实物理数据
                const txIdsToDelete = Array.from(txMap.keys())
                await db.transactions.bulkDelete(txIdsToDelete)

                // 5. 对被点击清空的主账户实行绝对清算，强行重置为 0
                const targetAccount = await db.accounts.get(selectedAccountToClear)
                if (targetAccount) {
                    await db.accounts.update(selectedAccountToClear, { balance: 0 })
                }
            })
            toast.success("该账户的双边交易网络及关联余额已全数拆解并清退完毕")
            setSelectedAccountToClear("")
        } catch (error) {
            console.error("清空特定账户级联失败:", error)
            toast.error("清空失败，请重试")
        } finally {
            setIsProcessing(false)
            setClearAccountConfirmOpen(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                    <Database className="mr-2 h-4 w-4" />
                    数据管理
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>数据管理</DialogTitle>
                    <DialogDescription>
                        您可以导出数据进行备份，或导入历史数据。
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="export" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="export">导出</TabsTrigger>
                        <TabsTrigger value="import">导入</TabsTrigger>
                        <TabsTrigger value="danger">危险区域</TabsTrigger>
                    </TabsList>

                    <TabsContent value="export" className="space-y-4 py-4">
                        <div className="space-y-4">
                            <Button variant="outline" className="w-full justify-start h-auto py-3" onClick={exportJson}>
                                <div className="flex flex-col items-start gap-1">
                                    <div className="flex items-center">
                                        <Download className="mr-2 h-4 w-4" />
                                        <span>导出原始备份 (JSON)</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">完整备份所有账户与分类等数据库原文，用于整体迁移或恢复。</span>
                                </div>
                            </Button>
                            <Button variant="outline" className="w-full justify-start h-auto py-3" onClick={exportXlsx}>
                                <div className="flex flex-col items-start gap-1">
                                    <div className="flex items-center">
                                        <FileText className="mr-2 h-4 w-4" />
                                        <span>导出报表 (XLSX)</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">导出原生 Excel 文件，规避科学计数法，方便进行高复杂度的二次报表分析。</span>
                                </div>
                            </Button>
                            <Button variant="outline" className="w-full justify-start h-auto py-3" onClick={exportTxt}>
                                <div className="flex flex-col items-start gap-1">
                                    <div className="flex items-center">
                                        <FileText className="mr-2 h-4 w-4" />
                                        <span>导出文本账单 (TXT)</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">导出为简单的可读文本格式，兼容旧版钱迹等其他记账软件格式。</span>
                                </div>
                            </Button>
                        </div>
                    </TabsContent>

                    <TabsContent value="import" className="space-y-4 py-4">
                        <div className="space-y-4">
                            <Button variant="outline" className="w-full justify-start h-auto py-3" onClick={importJson}>
                                <div className="flex flex-col items-start gap-1">
                                    <div className="flex items-center">
                                        <Upload className="mr-2 h-4 w-4" />
                                        <span>恢复备份 (JSON)</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">从 JSON 文件恢复数据，将覆盖当前数据。</span>
                                </div>
                            </Button>
                            <Button variant="outline" className="w-full justify-start h-auto py-3" onClick={importXlsx} disabled={importing}>
                                <div className="flex flex-col items-start gap-1">
                                    <div className="flex items-center">
                                        <FileText className="mr-2 h-4 w-4" />
                                        <span>导入报表 (XLSX)</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">导入自带 ID 特征的格式化 Excel 表格，进行无损全量关系映射还原。</span>
                                </div>
                            </Button>
                            <Button variant="outline" className="w-full justify-start h-auto py-3" onClick={importTxt} disabled={importing}>
                                <div className="flex flex-col items-start gap-1">
                                    <div className="flex items-center">
                                        <FileText className="mr-2 h-4 w-4" />
                                        <span>导入账单 (TXT)</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">导入历史文本账单，自动创建分类。</span>
                                </div>
                            </Button>
                        </div>
                    </TabsContent>

                    <TabsContent value="danger" className="space-y-4 py-4">
                        <div className="rounded-md border border-destructive/50 p-4">
                            <div className="flex items-center gap-2 text-destructive mb-2">
                                <AlertTriangle className="h-4 w-4" />
                                <h4 className="font-medium">清空数据</h4>
                            </div>
                            <p className="text-sm text-muted-foreground mb-4">
                                您可以选择清空特定账户的交易记录，或清空系统中的所有数据。内置分类将始终保留。
                            </p>

                            {accounts.length > 0 && (
                                <div className="flex flex-col gap-2 mb-6 p-3 bg-secondary/20 rounded-lg">
                                    <label className="text-sm font-medium">清空特定账户交易记录</label>
                                    <div className="flex gap-2 items-center">
                                        <div className="flex-1">
                                            <SearchableSelect
                                                options={accountOptions}
                                                value={selectedAccountToClear}
                                                onValueChange={setSelectedAccountToClear}
                                                placeholder="选择要清空的账户"
                                                searchPlaceholder="搜索账户..."
                                            />
                                        </div>
                                        <Button
                                            variant="outline"
                                            className="text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
                                            disabled={!selectedAccountToClear}
                                            onClick={() => setClearAccountConfirmOpen(true)}
                                            title="清空该账户"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-destructive">危险操作</label>
                                <Button variant="destructive" className="w-full" onClick={() => setClearConfirmOpen(true)}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    清空所有数据 (保留内置分类)
                                </Button>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>

            <ConfirmationModal
                open={clearAccountConfirmOpen}
                onOpenChange={setClearAccountConfirmOpen}
                title="确定清空该账户吗？"
                description="此操作将永久删除该账户下的所有交易记录（账户本身将保留），不可撤销！"
                confirmText="清空该账户记录"
                variant="destructive"
                onConfirm={clearAccountData}
            />
            <ConfirmationModal
                open={clearConfirmOpen}
                onOpenChange={setClearConfirmOpen}
                title="确定要重置清空所有数据吗？"
                description="此操作将清空所有账户和交易连同自建分类，不可撤销！确定继续？"
                confirmText="清空所有数据"
                variant="destructive"
                onConfirm={clearAllData}
            />
            <ConfirmationModal
                open={jsonImportConfirmOpen}
                onOpenChange={setJsonImportConfirmOpen}
                title="确定导入 JSON 备份？"
                description="导入将覆盖当前所有数据（账户、分类、交易记录），此操作不可撤销。"
                confirmText="确定导入"
                variant="destructive"
                onConfirm={doJsonImport}
            />
            <ConfirmationModal
                open={txtImportConfirmOpen}
                onOpenChange={(v) => {
                    setTxtImportConfirmOpen(v)
                    if (v && accounts.length > 0 && !selectedAccountId) {
                        setSelectedAccountId(accounts[0].id)
                    }
                }}
                title={`确定导入 ${pendingTxtParsed.current?.length ?? 0} 条交易记录？`}
                description={accounts.length === 0 ? "当前没有账户，导入时将自动创建默认账户。" : "请选择导入数据挂载的目标账户："}
                confirmText="确定导入"
                onConfirm={preCheckTxtImport}
            >
                {accounts.length > 0 && (
                    <div className="py-2">
                        <SearchableSelect
                            options={accountOptions}
                            value={selectedAccountId}
                            onValueChange={setSelectedAccountId}
                            placeholder="选择目标账户"
                            searchPlaceholder="搜索账户..."
                        />
                    </div>
                )}
            </ConfirmationModal>

            <ConfirmationModal
                open={txtDuplicateConfirmOpen}
                onOpenChange={setTxtDuplicateConfirmOpen}
                title={`过滤还是保留重复数据？`}
                description={`我们在您即将导入的账单中，检测到了 ${txtDuplicateCount} 条可能已经在当前账户存在的记录。您希望如何处理？`}
                confirmText="跳过重复项（推荐）"
                cancelText="依然全部导入"
                onConfirm={() => executeTxtImport(true)}      // confirm 表示选用推荐安全操作
                onCancel={() => executeTxtImport(false)}      // cancel 这里当作另一个 action
            />

            <ConfirmationModal
                open={excelDuplicateConfirmOpen}
                onOpenChange={setExcelDuplicateConfirmOpen}
                title={`发现 ${pendingExcelParsed.current?.length ?? 0} 条代办导入的表格数据`}
                description={`已启用系统底层 ID 精密对齐覆盖。如果您重新修改了表单的金额和内容，请直接点击“重新覆盖”。\n\n您是否希望直接覆盖现有相同源 ID 的数据或补充缺失数据？（对于手工新增、未带 ID 的行列，系统将防呆查重）`}
                confirmText="防呆查重、补充导入并覆盖旧记录"
                cancelText="强行全部无脑插入（不仅覆盖还要复制）"
                onConfirm={() => executeExcelImport(true)}
                onCancel={() => executeExcelImport(false)}
            />

            <LoadingMask open={isProcessing || importing} text="数据处理中，请稍候..." />
        </Dialog>
    )
}
