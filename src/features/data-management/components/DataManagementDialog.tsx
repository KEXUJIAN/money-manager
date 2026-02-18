import { useState } from "react"
import { db } from "@/db"
import { Download, Upload, Trash2, FileText, Database, AlertTriangle } from "lucide-react"
import { LEGACY_TXT_DELIMITER, LEGACY_TXT_HEADER } from "@/lib/constants"

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
import { parseLegacyTxt, importLegacyData } from "@/features/import/importLegacy"

export function DataManagementDialog() {
    const [open, setOpen] = useState(false)
    const [importing, setImporting] = useState(false)
    const [clearConfirmOpen, setClearConfirmOpen] = useState(false)

    // ---- 数据导出 (JSON) ----
    async function exportJson() {
        try {
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

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `money-manager-backup-${new Date().toISOString().slice(0, 10)}.json`
            a.click()
            URL.revokeObjectURL(url)
        } catch (error) {
            console.error("Export failed:", error)
        }
    }

    // ---- 数据导出 (TXT) ----
    async function exportTxt() {
        try {
            const transactions = await db.transactions.toArray()
            // 按时间升序排列（最早 → 最新）
            transactions.sort((a, b) => a.date - b.date)
            const categories = await db.categories.toArray()

            const lines = [LEGACY_TXT_HEADER]
            const categoryMap = new Map()
            categories.forEach(c => categoryMap.set(c.id, c.name))

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
                const typeStr = tx.type === 'expense' ? '支出' : (tx.type === 'income' ? '收入' : '转账')
                const catName = categoryMap.get(tx.categoryId) || "其他"
                // 支出为负数，收入为正数
                const amount = tx.type === 'expense' ? -tx.amount : tx.amount
                const note = tx.note || ""

                lines.push([dateStr, typeStr, catName, amount.toFixed(2), note].join(LEGACY_TXT_DELIMITER))
            })

            const content = lines.join("\n")
            const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `money-manager-export-${new Date().toISOString().slice(0, 10)}.txt`
            a.click()
            URL.revokeObjectURL(url)

        } catch (error) {
            console.error("TXT Export failed:", error)
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
                    alert("无效的备份文件格式")
                    return
                }

                if (!confirm("导入将覆盖当前所有数据，确定继续？")) return

                await db.transaction("rw", db.accounts, db.categories, db.transactions, async () => {
                    await db.accounts.clear()
                    await db.categories.clear()
                    await db.transactions.clear()

                    if (data.accounts?.length) await db.accounts.bulkAdd(data.accounts)
                    if (data.categories?.length) await db.categories.bulkAdd(data.categories)
                    if (data.transactions?.length) await db.transactions.bulkAdd(data.transactions)
                })

                alert("导入成功！")
                setOpen(false)
            } catch (error) {
                console.error("Import failed:", error)
                alert("导入失败，请检查文件格式")
            }
        }
        input.click()
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
                    alert("未找到有效的交易记录，请检查文件格式")
                    return
                }

                if (!confirm(`解析到 ${parsed.length} 条交易记录，确定导入？`)) return

                const result = await importLegacyData(parsed)
                alert(`导入完成！\n✅ 导入 ${result.imported} 条交易\n📂 新建 ${result.categoriesCreated} 个分类`)
                setOpen(false)
            } catch (error) {
                console.error("Legacy import failed:", error)
                alert("导入失败：" + (error instanceof Error ? error.message : "未知错误"))
            } finally {
                setImporting(false)
            }
        }
        input.click()
    }

    // ---- 清空数据 ----
    async function clearAllData() {
        try {
            await db.transaction("rw", db.accounts, db.categories, db.transactions, async () => {
                await db.accounts.clear()
                await db.categories.clear()
                await db.transactions.clear()
            })
            alert("数据已清空")
            setOpen(false)
        } catch (error) {
            console.error("Clear failed:", error)
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
                                        <span>导出备份 (JSON)</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">完整备份所有数据，用于迁移或恢复。</span>
                                </div>
                            </Button>
                            <Button variant="outline" className="w-full justify-start h-auto py-3" onClick={exportTxt}>
                                <div className="flex flex-col items-start gap-1">
                                    <div className="flex items-center">
                                        <FileText className="mr-2 h-4 w-4" />
                                        <span>导出账单 (TXT)</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">导出为可读文本格式，兼容其他软件。</span>
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
                                <h4 className="font-medium">清空所有数据</h4>
                            </div>
                            <p className="text-sm text-muted-foreground mb-4">
                                此操作将永久删除所有账户、分类和交易记录，且无法恢复。请谨慎操作。
                            </p>
                            <Button variant="destructive" className="w-full" onClick={() => setClearConfirmOpen(true)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                清空数据
                            </Button>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>

            <ConfirmationModal
                open={clearConfirmOpen}
                onOpenChange={setClearConfirmOpen}
                title="确定要清空所有数据吗？"
                description="此操作不可撤销！建议您先导出备份。确定继续？"
                confirmText="清空所有数据"
                variant="destructive"
                onConfirm={clearAllData}
            />
        </Dialog>
    )
}
