import { useState, useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { v4 as uuidv4 } from "uuid"
import { Plus } from "lucide-react"

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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

const formSchema = z.object({
    amount: z.coerce.number().min(0.01, "金额必须大于 0"),
    type: z.enum(['income', 'expense']),
    accountId: z.string().min(1, "请选择账户"),
    categoryId: z.string().min(1, "请选择分类"),
    date: z.string().min(1, "请选择日期"),
    note: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

/**
 * 获取当前时间的 datetime-local 格式字符串（秒归零）
 * 格式：YYYY-MM-DDTHH:mm
 */
function getNowDatetimeLocal(): string {
    const now = new Date()
    now.setSeconds(0, 0)
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
}

export function AddTransactionSheet() {
    const [open, setOpen] = useState(false)
    const [activeTab, setActiveTab] = useState("expense")

    const accounts = useLiveQuery(() => db.accounts.toArray()) || []
    const categories = useLiveQuery(() => db.categories.toArray()) || []

    const filteredCategories = useMemo(
        () => categories.filter(c => c.type === activeTab),
        [categories, activeTab]
    )

    const form = useForm<FormValues>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(formSchema) as any, // any 理由：zodResolver 与 react-hook-form 泛型不完全兼容
        defaultValues: {
            amount: 0,
            type: "expense",
            accountId: "",
            categoryId: "",
            date: getNowDatetimeLocal(),
            note: "",
        },
    })

    // 打开侧边栏时，重置时间为当前时间
    useEffect(() => {
        if (open) {
            form.setValue("date", getNowDatetimeLocal())
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

    async function onSubmit(values: FormValues) {
        try {
            const transactionId = uuidv4()

            // 解析 datetime-local 字符串并强制秒归零
            const dateObj = new Date(values.date)
            dateObj.setSeconds(0, 0)

            // 备注为空时，自动填充分类名
            let note = values.note?.trim() || ""
            if (!note) {
                const category = categories.find(c => c.id === values.categoryId)
                note = category?.name || ""
            }

            await db.transaction('rw', db.transactions, db.accounts, async () => {
                await db.transactions.add({
                    id: transactionId,
                    amount: values.amount,
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
                        ? account.balance - values.amount
                        : account.balance + values.amount
                    await db.accounts.update(values.accountId, { balance: newBalance })
                }
            })

            setOpen(false)
            form.reset({
                amount: 0,
                type: activeTab as "income" | "expense",
                accountId: values.accountId, // 保留上次使用的账户
                categoryId: "",
                date: getNowDatetimeLocal(),
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
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="expense">支出</TabsTrigger>
                        <TabsTrigger value="income">收入</TabsTrigger>
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
                                        <div className="relative">
                                            <span className="absolute left-3 top-2.5 text-muted-foreground">¥</span>
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
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="选择账户" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {accounts.map(acc => (
                                                <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
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
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="选择分类" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {filteredCategories.map(cat => (
                                                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
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
                                        <Input
                                            type="datetime-local"
                                            step="60"
                                            {...field}
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
                                    <FormLabel>备注</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="备注（可选，为空则自动填充分类名）" {...field} />
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
        </Sheet>
    )
}
