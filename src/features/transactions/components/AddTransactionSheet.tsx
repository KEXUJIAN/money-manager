import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { v4 as uuidv4 } from "uuid"
import { format } from "date-fns"
import { CalendarIcon, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

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
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

const formSchema = z.object({
    amount: z.coerce.number().min(0.01, "金额必须大于 0"),
    type: z.enum(['income', 'expense', 'transfer']),
    accountId: z.string().min(1, "请选择账户"),
    toAccountId: z.string().optional(),
    categoryId: z.string().optional(),
    date: z.date(),
    note: z.string().optional(),
}).refine(data => {
    if (data.type === 'transfer' && !data.toAccountId) {
        return false;
    }
    return true;
}, {
    message: "转账需要选择目标账户",
    path: ["toAccountId"],
}).refine(data => {
    if (data.type === 'transfer' && data.accountId === data.toAccountId) {
        return false;
    }
    return true;
}, {
    message: "不能转账到同一账户",
    path: ["toAccountId"],
});

type FormValues = z.infer<typeof formSchema>

export function AddTransactionSheet() {
    const [open, setOpen] = useState(false)
    const [activeTab, setActiveTab] = useState("expense")

    const accounts = useLiveQuery(() => db.accounts.toArray()) || []
    const categories = useLiveQuery(() => db.categories.toArray()) || []

    const form = useForm<FormValues>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            amount: 0,
            type: "expense",
            accountId: "",
            toAccountId: "",
            categoryId: "",
            date: new Date(),
            note: "",
        },
    })

    // Reset certain fields when type changes
    useEffect(() => {
        form.setValue("type", activeTab as any)
        if (activeTab === 'transfer') {
            form.setValue("categoryId", undefined)
        } else {
            form.setValue("toAccountId", undefined)
        }
    }, [activeTab, form])

    async function onSubmit(values: FormValues) {
        try {
            const transactionId = uuidv4();

            await db.transaction('rw', db.transactions, db.accounts, async () => {
                // Add Transaction
                await db.transactions.add({
                    id: transactionId,
                    amount: values.amount,
                    type: values.type,
                    accountId: values.accountId,
                    toAccountId: values.toAccountId,
                    categoryId: values.categoryId,
                    date: values.date.getTime(),
                    note: values.note,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                })

                // Update Account Balances
                const account = await db.accounts.get(values.accountId);
                if (account) {
                    let newBalance = account.balance;
                    if (values.type === 'expense') {
                        newBalance -= values.amount;
                    } else if (values.type === 'income') {
                        newBalance += values.amount;
                    } else if (values.type === 'transfer') {
                        newBalance -= values.amount;
                    }
                    await db.accounts.update(values.accountId, { balance: newBalance });
                }

                if (values.type === 'transfer' && values.toAccountId) {
                    const toAccount = await db.accounts.get(values.toAccountId);
                    if (toAccount) {
                        await db.accounts.update(values.toAccountId, { balance: toAccount.balance + values.amount });
                    }
                }
            });

            setOpen(false)
            form.reset({
                amount: 0,
                type: activeTab as any,
                accountId: values.accountId, // Keep the last used account
                toAccountId: "",
                categoryId: "",
                date: new Date(),
                note: "",
            })
        } catch (error) {
            console.error("Failed to add transaction:", error)
        }
    }

    const filteredCategories = categories.filter(c => c.type === activeTab);

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
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="expense">支出</TabsTrigger>
                        <TabsTrigger value="income">收入</TabsTrigger>
                        <TabsTrigger value="transfer">转账</TabsTrigger>
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
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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

                        {activeTab === 'transfer' && (
                            <FormField
                                control={form.control}
                                name="toAccountId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>转入账户</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="选择目标账户" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {accounts.filter(a => a.id !== form.watch('accountId')).map(acc => (
                                                    <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        {activeTab !== 'transfer' && (
                            <FormField
                                control={form.control}
                                name="categoryId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>分类</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                        )}

                        <FormField
                            control={form.control}
                            name="date"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>日期</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "w-full pl-3 text-left font-normal",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                >
                                                    {field.value ? (
                                                        format(field.value, "yyyy-MM-dd")
                                                    ) : (
                                                        <span>选择日期</span>
                                                    )}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={field.value}
                                                onSelect={field.onChange}
                                                disabled={(date) =>
                                                    date > new Date() || date < new Date("1900-01-01")
                                                }
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
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
                                        <Textarea placeholder="备注（可选）" {...field} />
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
