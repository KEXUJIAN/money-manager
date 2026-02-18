import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { v4 as uuidv4 } from "uuid"
import { db } from "@/db"
import type { Account } from "@/db"

import { Button } from "@/components/ui/button"
import { ConfirmationModal } from "@/components/ui/confirmation-modal"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
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
import { Trash2 } from "lucide-react"

const formSchema = z.object({
    name: z.string().min(1, "Name is required"),
    type: z.enum(['cash', 'bank', 'alipay', 'wechat', 'credit_card', 'other']),
    balance: z.coerce.number(),
    currency: z.string(),
})

type FormValues = z.infer<typeof formSchema>

interface AccountFormSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    account?: Account
}

export function AccountFormSheet({ open, onOpenChange, account }: AccountFormSheetProps) {
    const form = useForm<FormValues>({
        // any 理由：zodResolver 类型推导与 useForm 泛型在 coerce 场景下存在已知不兼容，强制转换以通过类型检查
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            name: "",
            type: "cash",
            balance: 0,
            currency: "CNY",
        },
    })

    useEffect(() => {
        if (account) {
            form.reset({
                name: account.name,
                type: account.type,
                balance: account.balance,
                currency: account.currency,
            })
        } else {
            form.reset({
                name: "",
                type: "cash",
                balance: 0,
                currency: "CNY",
            })
        }
    }, [account, form, open])

    const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)

    async function onSubmit(values: FormValues) {
        try {
            if (account) {
                await db.accounts.update(account.id, {
                    ...values,
                    updatedAt: Date.now(),
                })
            } else {
                await db.accounts.add({
                    id: uuidv4(),
                    ...values,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                })
            }
            onOpenChange(false)
        } catch (error) {
            console.error("Failed to save account:", error)
        }
    }

    async function handleDelete() {
        if (!account) return
        await db.accounts.delete(account.id)
        setDeleteConfirmationOpen(false)
        onOpenChange(false)
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>{account ? "编辑账户" : "添加账户"}</SheetTitle>
                    <SheetDescription>
                        {account ? "更新账户详情" : "创建新账户以追踪余额"}
                    </SheetDescription>
                </SheetHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>账户名称</FormLabel>
                                    <FormControl>
                                        <Input placeholder="例如：现金钱包" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>账户类型</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="选择账户类型" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="cash">现金</SelectItem>
                                            <SelectItem value="bank">银行卡</SelectItem>
                                            <SelectItem value="alipay">支付宝</SelectItem>
                                            <SelectItem value="wechat">微信</SelectItem>
                                            <SelectItem value="credit_card">信用卡</SelectItem>
                                            <SelectItem value="other">其他</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="balance"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>当前余额</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex gap-2">
                            <Button type="submit" className="flex-1">
                                {account ? "保存修改" : "创建账户"}
                            </Button>
                            {account && (
                                <Button type="button" variant="destructive" size="icon" onClick={() => setDeleteConfirmationOpen(true)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </form>
                </Form>

                <ConfirmationModal
                    open={deleteConfirmationOpen}
                    onOpenChange={setDeleteConfirmationOpen}
                    title="确定删除此账户？"
                    description="此操作不可撤销，账户下的所有交易也将被删除。"
                    confirmText="删除"
                    onConfirm={handleDelete}
                    variant="destructive"
                />
            </SheetContent>
        </Sheet>
    )
}
