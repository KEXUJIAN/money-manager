import { useState } from "react"
import { db } from "@/db"
import { useLiveQuery } from "dexie-react-hooks"
import { v4 as uuidv4 } from "uuid"
import { Download, Upload, Trash2, Plus, FileText } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { parseLegacyTxt, importLegacyData } from "@/features/import/importLegacy"

export default function Settings() {
    const categories = useLiveQuery(() => db.categories.toArray()) || []
    const [newCatName, setNewCatName] = useState("")
    const [newCatType, setNewCatType] = useState<"income" | "expense">("expense")
    const [importing, setImporting] = useState(false)

    // ---- 分类管理 ----
    async function addCategory() {
        if (!newCatName.trim()) return
        try {
            await db.categories.add({
                id: uuidv4(),
                name: newCatName.trim(),
                type: newCatType,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            })
            setNewCatName("")
        } catch (error) {
            console.error("Failed to add category:", error)
        }
    }

    async function deleteCategory(id: string) {
        const cat = categories.find(c => c.id === id)
        if (cat?.isBuiltin) {
            alert("内置分类不可删除")
            return
        }
        if (confirm("确定删除此分类？已关联的交易不受影响。")) {
            await db.categories.delete(id)
        }
    }

    // ---- 数据导出 ----
    async function exportData() {
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

    // ---- 数据导入 ----
    async function importData() {
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
            } catch (error) {
                console.error("Import failed:", error)
                alert("导入失败，请检查文件格式")
            }
        }
        input.click()
    }

    // ---- 清空数据 ----
    async function clearAllData() {
        if (!confirm("⚠️ 此操作将删除所有数据且无法恢复！建议先导出备份。确定继续？")) return
        if (!confirm("再次确认：真的要清空所有数据吗？")) return

        try {
            await db.transaction("rw", db.accounts, db.categories, db.transactions, async () => {
                await db.accounts.clear()
                await db.categories.clear()
                await db.transactions.clear()
            })
            alert("数据已清空")
        } catch (error) {
            console.error("Clear failed:", error)
        }
    }

    // ---- 导入历史账单 (TXT) ----
    async function importLegacyTxt() {
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
            } catch (error) {
                console.error("Legacy import failed:", error)
                alert("导入失败：" + (error instanceof Error ? error.message : "未知错误"))
            } finally {
                setImporting(false)
            }
        }
        input.click()
    }

    const expenseCategories = categories.filter(c => c.type === "expense")
    const incomeCategories = categories.filter(c => c.type === "income")

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold">设置</h2>

            {/* 分类管理 */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">分类管理</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* 添加新分类 */}
                    <div className="flex gap-2">
                        <Input
                            placeholder="分类名称..."
                            value={newCatName}
                            onChange={(e) => setNewCatName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && addCategory()}
                            className="flex-1"
                        />
                        <Select value={newCatType} onValueChange={(v) => setNewCatType(v as "income" | "expense")}>
                            <SelectTrigger className="w-[120px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="expense">支出</SelectItem>
                                <SelectItem value="income">收入</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button onClick={addCategory} size="icon">
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* 支出分类列表 */}
                    <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">支出分类</h4>
                        <div className="space-y-1">
                            {expenseCategories.map(cat => (
                                <div key={cat.id} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm">{cat.name}</span>
                                        {cat.isBuiltin && <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">内置</span>}
                                    </div>
                                    {!cat.isBuiltin && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7"
                                            onClick={() => deleteCategory(cat.id)}
                                        >
                                            <Trash2 className="h-3 w-3 text-muted-foreground" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                            {expenseCategories.length === 0 && (
                                <p className="text-sm text-muted-foreground">暂无支出分类</p>
                            )}
                        </div>
                    </div>

                    {/* 收入分类列表 */}
                    <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">收入分类</h4>
                        <div className="space-y-1">
                            {incomeCategories.map(cat => (
                                <div key={cat.id} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm">{cat.name}</span>
                                        {cat.isBuiltin && <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">内置</span>}
                                    </div>
                                    {!cat.isBuiltin && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7"
                                            onClick={() => deleteCategory(cat.id)}
                                        >
                                            <Trash2 className="h-3 w-3 text-muted-foreground" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                            {incomeCategories.length === 0 && (
                                <p className="text-sm text-muted-foreground">暂无收入分类</p>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 数据管理 */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">数据管理</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <Button variant="outline" className="w-full justify-start" onClick={exportData}>
                        <Download className="mr-2 h-4 w-4" />
                        导出数据 (JSON)
                    </Button>
                    <Button variant="outline" className="w-full justify-start" onClick={importData}>
                        <Upload className="mr-2 h-4 w-4" />
                        导入数据 (JSON 备份)
                    </Button>
                    <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={importLegacyTxt}
                        disabled={importing}
                    >
                        <FileText className="mr-2 h-4 w-4" />
                        {importing ? "导入中..." : "导入历史账单 (TXT)"}
                    </Button>
                    <Button variant="destructive" className="w-full justify-start" onClick={clearAllData}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        清空所有数据
                    </Button>
                </CardContent>
            </Card>

            {/* 版本信息 */}
            <Card>
                <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground text-center">
                        Money Manager v0.1.0
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
