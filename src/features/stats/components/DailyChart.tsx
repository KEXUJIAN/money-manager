import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { DailyData } from "../hooks/useStats"

interface DailyChartProps {
    data: DailyData[]
}

export function DailyChart({ data }: DailyChartProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-sm font-medium">每日趋势</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis
                                dataKey="date"
                                tick={{ fontSize: 10 }}
                                interval="preserveStartEnd"
                            />
                            <YAxis tick={{ fontSize: 10 }} width={50} />
                            <Tooltip
                                formatter={(value: any) => // any 理由：Recharts Tooltip formatter 的 value 类型定义包含 string/number/array 等多种可能，此处明确其为数值进行格式化
                                    new Intl.NumberFormat("zh-CN", {
                                        style: "currency",
                                        currency: "CNY",
                                    }).format(Number(value))
                                }
                            />
                            <Legend />
                            <Bar dataKey="income" name="收入" fill="#22c55e" radius={[2, 2, 0, 0]} />
                            <Bar dataKey="expense" name="支出" fill="#ef4444" radius={[2, 2, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
