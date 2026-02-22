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
import { ChevronDown, ChevronRight } from "lucide-react"

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
    const [expandedOther, setExpandedOther] = useState(false)

    const { processedData, subCategories } = useMemo(() => {
        const total = data.reduce((sum, item) => sum + item.value, 0)
        const threshold = total * 0.025 // 2.5% 作为阈值

        let otherValue = 0
        const subCats: CategoryData[] = []
        const filtered = data.filter((item) => {
            if (item.value < threshold) {
                otherValue += item.value
                subCats.push(item)
                return false
            }
            return true
        })

        // 按降序排列主要分类
        filtered.sort((a, b) => b.value - a.value)
        subCats.sort((a, b) => b.value - a.value)

        if (subCats.length > 0) {
            filtered.push({
                id: "aggregated-other",
                name: `其他聚合 (${subCats.length}项)`,
                value: otherValue,
                color: "#94a3b8", // Slate 400
            })
        }
        return { processedData: filtered, subCategories: subCats }
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
                                {processedData.map((entry) => (
                                    <Cell key={`cell-${entry.id}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value: any) => formatter.format(value)} /> {/* any 理由：Recharts Tooltip formatter value 类型包含多种可能 */}
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                {/* 分类明细列表 */}
                <div className="mt-4 space-y-2">
                    {processedData.map((item, index) => {
                        const isOther = item.id === "aggregated-other"
                        return (
                            <div key={item.id} className="flex flex-col">
                                <div
                                    className={`flex items-center justify-between text-sm p-1.5 rounded-md transition-colors ${isOther ? "cursor-pointer hover:bg-muted/70" : "cursor-default hover:bg-muted/50"
                                        }`}
                                    onMouseEnter={() => setActiveIndex(index)}
                                    onMouseLeave={() => setActiveIndex(-1)}
                                    onClick={() => isOther && setExpandedOther(!expandedOther)}
                                >
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="h-3 w-3 rounded-full flex-shrink-0 shadow-sm"
                                            style={{ backgroundColor: item.color }}
                                        />
                                        <span className={activeIndex === index ? "font-semibold text-foreground" : "text-muted-foreground flex items-center gap-1"}>
                                            {item.name}
                                            {isOther && (
                                                <span className="text-muted-foreground/50">
                                                    {expandedOther ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                    <span className={activeIndex === index ? "font-bold" : "font-medium"}>
                                        {formatter.format(item.value)}
                                    </span>
                                </div>
                                {/* 渲染聚合的其他项 */}
                                {isOther && expandedOther && subCategories.length > 0 && (
                                    <div className="mt-1 ml-6 pl-2 border-l-2 border-muted space-y-1">
                                        {subCategories.map((subItem) => (
                                            <div key={subItem.id} className="flex items-center justify-between text-xs p-1 text-muted-foreground/80 hover:text-foreground hover:bg-muted/30 rounded-md transition-colors">
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="h-2 w-2 rounded-full flex-shrink-0 opacity-80"
                                                        style={{ backgroundColor: subItem.color }}
                                                    />
                                                    <span>{subItem.name}</span>
                                                </div>
                                                <span>{formatter.format(subItem.value)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}
