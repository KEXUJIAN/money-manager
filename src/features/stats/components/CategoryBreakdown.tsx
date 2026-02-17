import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { CategoryData } from "../hooks/useMonthlyStats"

interface CategoryBreakdownProps {
    title: string
    data: CategoryData[]
}

const formatter = new Intl.NumberFormat("zh-CN", { style: "currency", currency: "CNY" })

export function CategoryBreakdown({ title, data }: CategoryBreakdownProps) {
    if (data.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium">{title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-48 flex items-center justify-center text-muted-foreground">
                        No data for this period
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={80}
                                paddingAngle={2}
                                dataKey="value"
                                nameKey="name"
                                label={({ name, percent }: any) => // any 理由：Recharts Pie label 回调参数类型定义不完整
                                    `${name} ${(percent * 100).toFixed(0)}%`
                                }
                                labelLine={false}
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value: any) => formatter.format(value)} /> {/* any 理由：Recharts Tooltip formatter value 类型包含多种可能 */}
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                {/* 分类明细列表 */}
                <div className="mt-4 space-y-2">
                    {data.map((item) => (
                        <div key={item.name} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <div
                                    className="h-3 w-3 rounded-full"
                                    style={{ backgroundColor: item.color }}
                                />
                                <span>{item.name}</span>
                            </div>
                            <span className="font-medium">{formatter.format(item.value)}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
