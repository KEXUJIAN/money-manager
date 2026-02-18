import { useState } from "react"
import { db } from "@/db"
import { useLiveQuery } from "dexie-react-hooks"
import { v4 as uuidv4 } from "uuid"
import { Trash2, Plus, ChevronDown, ChevronRight } from "lucide-react"

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
import { DataManagementDialog } from "@/features/data-management/components/DataManagementDialog"
import { ConfirmationModal } from "@/components/ui/confirmation-modal"

export default function Settings() {
    const categories = useLiveQuery(() => db.categories.toArray()) || []
    const [newCatName, setNewCatName] = useState("")
    const [newCatType, setNewCatType] = useState<"income" | "expense">("expense")

    // 折叠面板状态
    const [expenseOpen, setExpenseOpen] = useState(false)
    const [incomeOpen, setIncomeOpen] = useState(false)

    // 删除确认弹窗状态
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

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
            console.error("添加分类失败:", error)
        }
    }

    async function confirmDeleteCategory() {
        if (!deleteTarget) return
        try {
            await db.categories.delete(deleteTarget)
        } catch (error) {
            console.error("删除分类失败:", error)
        }
        setDeleteTarget(null)
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

                    {/* 支出分类列表（折叠面板） */}
                    <div className="border rounded-lg overflow-hidden">
                        <button
                            type="button"
                            className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-muted/50 transition-colors"
                            onClick={() => setExpenseOpen(!expenseOpen)}
                        >
                            <div className="flex items-center gap-2">
                                {expenseOpen
                                    ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                    : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                }
                                <span className="text-sm font-medium">支出分类</span>
                                <span className="text-xs text-muted-foreground">({expenseCategories.length})</span>
                            </div>
                        </button>
                        <div
                            className="transition-all duration-200 ease-in-out overflow-hidden"
                            style={{
                                maxHeight: expenseOpen ? `${expenseCategories.length * 44 + 16}px` : '0px',
                                opacity: expenseOpen ? 1 : 0,
                            }}
                        >
                            <div className="px-3 pb-2 space-y-1">
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
                                                onClick={() => setDeleteTarget(cat.id)}
                                            >
                                                <Trash2 className="h-3 w-3 text-muted-foreground" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                                {expenseCategories.length === 0 && (
                                    <p className="text-sm text-muted-foreground py-2">暂无支出分类</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 收入分类列表（折叠面板） */}
                    <div className="border rounded-lg overflow-hidden">
                        <button
                            type="button"
                            className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-muted/50 transition-colors"
                            onClick={() => setIncomeOpen(!incomeOpen)}
                        >
                            <div className="flex items-center gap-2">
                                {incomeOpen
                                    ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                    : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                }
                                <span className="text-sm font-medium">收入分类</span>
                                <span className="text-xs text-muted-foreground">({incomeCategories.length})</span>
                            </div>
                        </button>
                        <div
                            className="transition-all duration-200 ease-in-out overflow-hidden"
                            style={{
                                maxHeight: incomeOpen ? `${incomeCategories.length * 44 + 16}px` : '0px',
                                opacity: incomeOpen ? 1 : 0,
                            }}
                        >
                            <div className="px-3 pb-2 space-y-1">
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
                                                onClick={() => setDeleteTarget(cat.id)}
                                            >
                                                <Trash2 className="h-3 w-3 text-muted-foreground" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                                {incomeCategories.length === 0 && (
                                    <p className="text-sm text-muted-foreground py-2">暂无收入分类</p>
                                )}
                            </div>
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
                    <p className="text-sm text-muted-foreground">
                        您可以导出数据进行备份，或从文件导入历史记录。
                    </p>
                    <DataManagementDialog />
                </CardContent>
            </Card>

            {/* 版本信息 */}
            <Card>
                <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground text-center">
                        Money Manager v0.3.0
                    </p>
                </CardContent>
            </Card>

            {/* 删除分类确认弹窗 */}
            <ConfirmationModal
                open={deleteTarget !== null}
                onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
                title="删除分类"
                description="确定删除此分类？已关联的交易不受影响。"
                confirmText="删除"
                variant="destructive"
                onConfirm={confirmDeleteCategory}
            />
        </div>
    )
}
