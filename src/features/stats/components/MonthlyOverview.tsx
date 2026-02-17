import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Wallet } from "lucide-react"

interface MonthlyOverviewProps {
    totalIncome: number
    totalExpense: number
    balance: number
}

const formatter = new Intl.NumberFormat("zh-CN", { style: "currency", currency: "CNY" })

export function MonthlyOverview({ totalIncome, totalExpense, balance }: MonthlyOverviewProps) {
    return (
        <div className="grid gap-4 grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">收入</CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-lg font-bold text-green-600">
                        {formatter.format(totalIncome)}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">支出</CardTitle>
                    <TrendingDown className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-lg font-bold text-red-600">
                        {formatter.format(totalExpense)}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">结余</CardTitle>
                    <Wallet className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                    <div className={`text-lg font-bold ${balance >= 0 ? "text-blue-600" : "text-red-600"}`}>
                        {formatter.format(balance)}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
