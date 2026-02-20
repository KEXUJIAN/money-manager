import { useState, useMemo, useEffect } from "react"
import { db } from "@/db"
import { useLiveQuery } from "dexie-react-hooks"
import { v4 as uuidv4 } from "uuid"
import { Trash2, Plus, ChevronDown, ChevronRight, Search } from "lucide-react"
import { toast } from "sonner"

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

    // 添加分类输入联动防抖
    const [isComposing, setIsComposing] = useState(false)
    const [debouncedCatName, setDebouncedCatName] = useState("")

    useEffect(() => {
        if (isComposing) return
        const timer = setTimeout(() => {
            setDebouncedCatName(newCatName)
        }, 300)
        return () => clearTimeout(timer)
    }, [newCatName, isComposing])

    // 折叠面板状态
    const [expenseOpen, setExpenseOpen] = useState(false)
    const [incomeOpen, setIncomeOpen] = useState(false)

    // 搜索过滤状态
    const [expenseSearch, setExpenseSearch] = useState("")
    const [incomeSearch, setIncomeSearch] = useState("")

    // 删除确认弹窗状态
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

    const expenseCategories = useMemo(
        () => categories.filter(c => c.type === "expense"),
        [categories]
    )
    const incomeCategories = useMemo(
        () => categories.filter(c => c.type === "income"),
        [categories]
    )

    // 计算实际的搜索词（添加分类联动优先级更高）
    const activeExpenseSearch = (newCatType === "expense" && debouncedCatName) ? debouncedCatName : expenseSearch
    const activeIncomeSearch = (newCatType === "income" && debouncedCatName) ? debouncedCatName : incomeSearch

    // 搜索过滤后的列表
    const filteredExpense = useMemo(
        () => activeExpenseSearch
            ? expenseCategories.filter(c => c.name.toLowerCase().includes(activeExpenseSearch.toLowerCase()))
            : expenseCategories,
        [expenseCategories, activeExpenseSearch]
    )
    const filteredIncome = useMemo(
        () => activeIncomeSearch
            ? incomeCategories.filter(c => c.name.toLowerCase().includes(activeIncomeSearch.toLowerCase()))
            : incomeCategories,
        [incomeCategories, activeIncomeSearch]
    )

    // 如果添加分类框输入了内容，自动展开对应的面板
    const effectiveExpenseOpen = expenseOpen || (newCatType === "expense" && debouncedCatName && filteredExpense.length > 0)
    const effectiveIncomeOpen = incomeOpen || (newCatType === "income" && debouncedCatName && filteredIncome.length > 0)

    function highlight(text: string, keyword: string) {
        if (!keyword) return text
        const idx = text.toLowerCase().indexOf(keyword.toLowerCase())
        if (idx < 0) return text
        const before = text.slice(0, idx)
        const match = text.slice(idx, idx + keyword.length)
        const after = text.slice(idx + keyword.length)
        return (
            <>
                {before}
                <mark className="bg-yellow-200 dark:bg-yellow-700/60 text-inherit rounded-sm px-0.5">{match}</mark>
                {after}
            </>
        )
    }

    // ---- 分类管理 ----
    async function addCategory() {
        const name = newCatName.trim()

        // 空值校验
        if (!name) {
            toast.error("分类名称不能为空")
            return
        }

        // 同类型防重校验
        const sameTypeList = newCatType === "expense" ? expenseCategories : incomeCategories
        const duplicated = sameTypeList.some(c => c.name === name)
        if (duplicated) {
            toast.error(`「${name}」已存在，请更换名称`)
            return
        }

        try {
            await db.categories.add({
                id: uuidv4(),
                name,
                type: newCatType,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            })
            setNewCatName("")
            toast.success(`分类「${name}」添加成功`)
        } catch (error) {
            console.error("添加分类失败:", error)
            toast.error("添加分类失败，请重试")
        }
    }

    async function confirmDeleteCategory() {
        if (!deleteTarget) return
        try {
            await db.categories.delete(deleteTarget)
            toast.success("分类已删除")
        } catch (error) {
            console.error("删除分类失败:", error)
            toast.error("删除分类失败")
        }
        setDeleteTarget(null)
    }

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
                            onCompositionStart={() => setIsComposing(true)}
                            onCompositionEnd={(e) => {
                                setIsComposing(false)
                                setNewCatName((e.target as HTMLInputElement).value)
                            }}
                            onKeyDown={(e) => e.key === "Enter" && !isComposing && addCategory()}
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

                    <div className="border rounded-lg overflow-hidden">
                        <button
                            type="button"
                            className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-muted/50 transition-colors"
                            onClick={() => setExpenseOpen(!expenseOpen)}
                        >
                            <div className="flex items-center gap-2">
                                {effectiveExpenseOpen
                                    ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                    : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                }
                                <span className="text-sm font-medium">支出分类</span>
                                <span className="text-xs text-muted-foreground">({expenseCategories.length})</span>
                            </div>
                        </button>
                        {effectiveExpenseOpen && (
                            <div className="px-3 pb-2 space-y-2 border-t">
                                {/* 搜索框 */}
                                <div className="flex items-center gap-2 pt-2">
                                    <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <Input
                                        placeholder="搜索支出分类..."
                                        value={expenseSearch}
                                        onChange={e => setExpenseSearch(e.target.value)}
                                        className="h-8 text-sm"
                                    />
                                </div>
                                <div className="space-y-1">
                                    {filteredExpense.map(cat => (
                                        <div key={cat.id} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm">{highlight(cat.name, activeExpenseSearch)}</span>
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
                                    {filteredExpense.length === 0 && (
                                        <p className="text-sm text-muted-foreground py-2">
                                            {activeExpenseSearch ? "无匹配项" : "暂无支出分类"}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="border rounded-lg overflow-hidden">
                        <button
                            type="button"
                            className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-muted/50 transition-colors"
                            onClick={() => setIncomeOpen(!incomeOpen)}
                        >
                            <div className="flex items-center gap-2">
                                {effectiveIncomeOpen
                                    ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                    : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                }
                                <span className="text-sm font-medium">收入分类</span>
                                <span className="text-xs text-muted-foreground">({incomeCategories.length})</span>
                            </div>
                        </button>
                        {effectiveIncomeOpen && (
                            <div className="px-3 pb-2 space-y-2 border-t">
                                {/* 搜索框 */}
                                <div className="flex items-center gap-2 pt-2">
                                    <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <Input
                                        placeholder="搜索收入分类..."
                                        value={incomeSearch}
                                        onChange={e => setIncomeSearch(e.target.value)}
                                        className="h-8 text-sm"
                                    />
                                </div>
                                <div className="space-y-1">
                                    {filteredIncome.map(cat => (
                                        <div key={cat.id} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm">{highlight(cat.name, activeIncomeSearch)}</span>
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
                                    {filteredIncome.length === 0 && (
                                        <p className="text-sm text-muted-foreground py-2">
                                            {activeIncomeSearch ? "无匹配项" : "暂无收入分类"}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
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
                        Money Manager v0.3.1
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
