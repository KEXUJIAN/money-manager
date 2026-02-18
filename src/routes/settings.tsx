import { useState } from "react"
import { db } from "@/db"
import { useLiveQuery } from "dexie-react-hooks"
import { v4 as uuidv4 } from "uuid"
import { Trash2, Plus } from "lucide-react"

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

export default function Settings() {
    const categories = useLiveQuery(() => db.categories.toArray()) || []
    const [newCatName, setNewCatName] = useState("")
    const [newCatType, setNewCatType] = useState<"income" | "expense">("expense")
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
                        Money Manager v0.1.1
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
