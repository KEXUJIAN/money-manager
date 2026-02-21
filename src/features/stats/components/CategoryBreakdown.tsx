import { useState, useMemo } from "react"
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Sector,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { CategoryData } from "../hooks/useStats"

const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props
    return (
        <g>
            <Sector
                cx={cx}
                cy={cy}
                innerRadius={innerRadius}
                outerRadius={outerRadius + 8}
                startAngle={startAngle}
                endAngle={endAngle}
                fill={fill}
                className="transition-all duration-300 drop-shadow-md"
            />
        </g>
    )
}

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

    const [activeIndex, setActiveIndex] = useState(-1)

    const processedData = useMemo(() => {
        const total = data.reduce((sum, item) => sum + item.value, 0)
        const threshold = total * 0.025 // 2.5% 作为阈值

        let otherValue = 0
        const filtered = data.filter((item) => {
            if (item.value < threshold) {
                otherValue += item.value
                return false
            }
            return true
        })

        // 按降序排列主要分类
        filtered.sort((a, b) => b.value - a.value)

        if (otherValue > 0) {
            filtered.push({
                name: "其他",
                value: otherValue,
                color: "#94a3b8", // Slate 400
            })
        }
        return filtered
    }, [data])

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
                                data={processedData}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={80}
                                paddingAngle={2}
                                dataKey="value"
                                nameKey="name"
                                {...({ activeIndex } as any)} // any 理由：Recharts Pie 组件由于版本类型缺失 activeIndex 的定义，使用 any 透传
                                activeShape={renderActiveShape}
                                onMouseEnter={(_, index) => setActiveIndex(index)}
                                onMouseLeave={() => setActiveIndex(-1)}
                            >
                                {processedData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value: any) => formatter.format(value)} /> {/* any 理由：Recharts Tooltip formatter value 类型包含多种可能 */}
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                {/* 分类明细列表 */}
                <div className="mt-4 space-y-2">
                    {processedData.map((item, index) => (
                        <div
                            key={item.name}
                            className="flex items-center justify-between text-sm p-1.5 rounded-md hover:bg-muted/50 cursor-default transition-colors"
                            onMouseEnter={() => setActiveIndex(index)}
                            onMouseLeave={() => setActiveIndex(-1)}
                        >
                            <div className="flex items-center gap-2">
                                <div
                                    className="h-3 w-3 rounded-full shadow-sm"
                                    style={{ backgroundColor: item.color }}
                                />
                                <span className={activeIndex === index ? "font-semibold text-foreground" : "text-muted-foreground"}>
                                    {item.name}
                                </span>
                            </div>
                            <span className={activeIndex === index ? "font-bold" : "font-medium"}>
                                {formatter.format(item.value)}
                            </span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
