import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { v4 as uuidv4 } from "uuid"
import { db } from "@/db"

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
import { Plus } from "lucide-react"

const formSchema = z.object({
    name: z.string().min(1, "Name is required"),
    type: z.enum(['cash', 'bank', 'alipay', 'wechat', 'credit_card', 'other']),
    balance: z.coerce.number(), // Removed default from schema to match useForm defaultValues
    currency: z.string(),
})

type FormValues = z.infer<typeof formSchema>

export function AddAccountSheet() {
    const [open, setOpen] = useState(false)

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            type: "cash",
            balance: 0,
            currency: "CNY",
        },
    })

    async function onSubmit(values: FormValues) {
        try {
            await db.accounts.add({
                id: uuidv4(),
                ...values,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            })
            setOpen(false)
            form.reset({
                name: "",
                type: "cash",
                balance: 0,
                currency: "CNY",
            })
        } catch (error) {
            console.error("Failed to add account:", error)
        }
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" /> Add Account
                </Button>
            </SheetTrigger>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Add Account</SheetTitle>
                    <SheetDescription>
                        Create a new account to track your balance.
                    </SheetDescription>
                </SheetHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Cash Wallet" {...field} />
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
                                    <FormLabel>Type</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select account type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="cash">Cash</SelectItem>
                                            <SelectItem value="bank">Bank</SelectItem>
                                            <SelectItem value="alipay">Alipay</SelectItem>
                                            <SelectItem value="wechat">WeChat</SelectItem>
                                            <SelectItem value="credit_card">Credit Card</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
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
                                    <FormLabel>Initial Balance</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full">
                            Create Account
                        </Button>
                    </form>
                </Form>
            </SheetContent>
        </Sheet>
    )
}
