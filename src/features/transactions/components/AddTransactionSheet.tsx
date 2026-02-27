import { useState, useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { generateId, cn } from "@/lib/utils"
import { Plus } from "lucide-react"
import { motion } from "framer-motion"
import { plus, minus, formatAmount } from "@/lib/math"

import { db } from "@/db"
import { useLiveQuery } from "dexie-react-hooks"

import { Button } from "@/components/ui/button"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { DateTimePicker } from "@/components/ui/date-time-picker"

/**
 * 获取当前时间（秒归零）
 */
function getNow(): Date {
    const now = new Date()
    now.setSeconds(0, 0)
    return now
}

const formSchema = z.object({
    amount: z.coerce.number().min(0.01, "金额必须大于 0"),
    type: z.enum(['income', 'expense']),
    accountId: z.string().min(1, "请选择账户"),
    categoryId: z.string().min(1, "请选择分类"),
    date: z.date(),
    note: z.string().max(50, "备注最多不能超过 50 个字符").optional(),
})

type FormValues = z.infer<typeof formSchema>

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"

export function AddTransactionSheet() {
    const [open, setOpen] = useState(false)
    const [activeTab, setActiveTab] = useState("expense")

    // Create Category Modal States
    const [createCategoryOpen, setCreateCategoryOpen] = useState(false)
    const [newCategoryName, setNewCategoryName] = useState("")

    const accounts = useLiveQuery(() => db.accounts.toArray()) || []
    const categories = useLiveQuery(() => db.categories.toArray()) || []

    const filteredCategories = useMemo(
        () => categories.filter(c => c.type === activeTab),
        [categories, activeTab]
    )

    const accountOptions = useMemo(
        () => accounts.map(a => ({ value: a.id, label: a.name })),
        [accounts]
    )

    const categoryOptions = useMemo(
        () => filteredCategories.map(c => ({ value: c.id, label: c.name })),
        [filteredCategories]
    )

    const form = useForm<FormValues>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(formSchema) as any, // any 理由：zodResolver 与 react-hook-form 泛型不完全兼容
        defaultValues: {
            amount: 0,
            type: "expense",
            accountId: "",
            categoryId: "",
            date: getNow(),
            note: "",
        },
    })

    // 打开侧边栏时，重置时间为当前时间
    useEffect(() => {
        if (open) {
            form.setValue("date", getNow())
        }
    }, [open, form])

    // 切换 Tab 时同步 type
    useEffect(() => {
        form.setValue("type", activeTab as "income" | "expense")
        // 切换类型后重置分类
        form.setValue("categoryId", "")
    }, [activeTab, form])

    // 账户加载后设置默认值（只在 accountId 为空时）
    useEffect(() => {
        const currentAccountId = form.getValues("accountId")
        if (!currentAccountId && accounts.length > 0) {
            form.setValue("accountId", accounts[0].id)
        }
    }, [accounts, form])

    // 分类列表变化后设置默认值（只在 categoryId 为空时）
    useEffect(() => {
        const currentCategoryId = form.getValues("categoryId")
        if (!currentCategoryId && filteredCategories.length > 0) {
            form.setValue("categoryId", filteredCategories[0].id)
        }
    }, [filteredCategories, form])

    async function handleCreateCategory() {
        if (!newCategoryName.trim()) return
        const newCatId = generateId()
        const now = Date.now()
        await db.categories.add({
            id: newCatId,
            name: newCategoryName.trim(),
            type: activeTab as "income" | "expense",
            createdAt: now,
            updatedAt: now,
        })
        form.setValue("categoryId", newCatId)
        setCreateCategoryOpen(false)
        setNewCategoryName("")
    }

    async function onSubmit(values: FormValues) {
        try {
            const transactionId = generateId(values.date)
            // Save transaction
            // 强制秒归零
            const dateObj = new Date(values.date)
            dateObj.setSeconds(0, 0)

            // 备注为空时，自动填充分类名
            let note = values.note?.trim() || ""
            if (!note) {
                const category = categories.find(c => c.id === values.categoryId)
                note = category?.name || ""
            }

            await db.transaction('rw', db.transactions, db.accounts, async () => {
                const finalAmount = formatAmount(values.amount)
                await db.transactions.add({
                    id: transactionId,
                    amount: finalAmount,
                    type: values.type,
                    accountId: values.accountId,
                    categoryId: values.categoryId,
                    date: dateObj.getTime(),
                    note,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                })

                // 更新账户余额
                const account = await db.accounts.get(values.accountId)
                if (account) {
                    const newBalance = values.type === 'expense'
                        ? minus(account.balance, finalAmount)
                        : plus(account.balance, finalAmount)
                    await db.accounts.update(values.accountId, { balance: newBalance })
                }
            })

            setOpen(false)
            form.reset({
                amount: 0,
                type: activeTab as "income" | "expense",
                accountId: values.accountId, // 保留上次使用的账户
                categoryId: "",
                date: getNow(),
                note: "",
            })
        } catch (error) {
            console.error("保存记录失败:", error)
        }
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button className="rounded-full h-12 w-12 shadow-lg fixed bottom-6 right-6 md:static md:h-9 md:w-auto md:shadow-none md:rounded-md">
                    <Plus className="h-6 w-6 md:mr-2 md:h-4 md:w-4" />
                    <span className="hidden md:inline">记一笔</span>
                </Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto w-full sm:max-w-md">
                <SheetHeader>
                    <SheetTitle>记一笔</SheetTitle>
                    <SheetDescription>记录一笔新的收支</SheetDescription>
                </SheetHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-4">
                    <TabsList className="relative flex w-full h-12 bg-transparent p-0 border-b border-border/50 rounded-none">
                        {["expense", "income"].map((tabValue) => {
                            const isActive = activeTab === tabValue
                            return (
                                <TabsTrigger
                                    key={tabValue}
                                    value={tabValue}
                                    className={cn(
                                        "relative flex-1 h-full rounded-none bg-transparent hover:bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-3 pt-2 text-base font-medium transition-colors",
                                        isActive ? "text-primary font-semibold" : "text-muted-foreground"
                                    )}
                                >
                                    {tabValue === "expense" ? "支出" : "收入"}
                                    {isActive && (
                                        <motion.div
                                            layoutId="add-tx-tab-indicator"
                                            className="absolute bottom-[-1px] left-0 right-0 h-[3px] bg-primary rounded-t-full z-10"
                                            initial={false}
                                            transition={{
                                                type: "spring",
                                                stiffness: 400,
                                                damping: 30
                                            }}
                                        />
                                    )}
                                </TabsTrigger>
                            )
                        })}
                    </TabsList>
                </Tabs>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>金额</FormLabel>
                                    <FormControl>
                                        <div className="relative flex items-center">
                                            <span className="absolute left-3 text-muted-foreground top-1/2 -translate-y-1/2">¥</span>
                                            <Input type="number" step="0.01" className="pl-7 text-lg font-bold" {...field} />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="accountId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>账户</FormLabel>
                                    <FormControl>
                                        <SearchableSelect
                                            options={accountOptions}
                                            value={field.value}
                                            onValueChange={field.onChange}
                                            placeholder="选择账户"
                                            searchPlaceholder="搜索账户..."
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="categoryId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>分类</FormLabel>
                                    <FormControl>
                                        <SearchableSelect
                                            options={categoryOptions}
                                            value={field.value}
                                            onValueChange={field.onChange}
                                            placeholder="选择分类"
                                            searchPlaceholder="搜索分类..."
                                            onCreateNew={(val) => {
                                                setNewCategoryName(val)
                                                setCreateCategoryOpen(true)
                                            }}
                                            createNewText="+ 新建分类"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="date"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>日期时间</FormLabel>
                                    <FormControl>
                                        <DateTimePicker
                                            value={field.value}
                                            onChange={field.onChange}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="note"
                            render={({ field }) => (
                                <FormItem>
                                    <div className="flex items-center justify-between">
                                        <FormLabel>备注</FormLabel>
                                        <span className="text-xs text-muted-foreground">
                                            {field.value?.length || 0}/50
                                        </span>
                                    </div>
                                    <FormControl>
                                        <Textarea
                                            placeholder="备注（可选，为空则自动填充分类名）"
                                            className="resize-none h-20"
                                            maxLength={50}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button type="submit" className="w-full">
                            保存
                        </Button>
                    </form>
                </Form>
            </SheetContent>

            <Dialog open={createCategoryOpen} onOpenChange={setCreateCategoryOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>新建{activeTab === "expense" ? "支出" : "收入"}分类</DialogTitle>
                        <DialogDescription>
                            快速添加一个适用于当前记账类型的分类
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                            placeholder="输入分类名称..."
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault()
                                    handleCreateCategory()
                                }
                            }}
                            autoFocus
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateCategoryOpen(false)}>取消</Button>
                        <Button onClick={handleCreateCategory} disabled={!newCategoryName.trim()}>确定</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Sheet>
    )
}
