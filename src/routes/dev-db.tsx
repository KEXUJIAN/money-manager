import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/db"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState, useRef, useMemo } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"

export default function DevDbPage() {
    const [searchTerm, setSearchTerm] = useState("")
    const accounts = useLiveQuery(() => db.accounts.toArray()) || []
    const categories = useLiveQuery(() => db.categories.toArray()) || []
    const transactions = useLiveQuery(() => db.transactions.toArray()) || []

    const filterData = (data: any[]) => {
        if (!searchTerm) return data
        const term = searchTerm.toLowerCase()
        return data.filter(item => 
            Object.values(item).some(val => 
                String(val).toLowerCase().includes(term)
            )
        )
    }

    const TableVirtualizer = ({ data, title }: { data: any[], title: string }) => {
        const parentRef = useRef<HTMLDivElement>(null)
        const filteredData = useMemo(() => filterData(data), [data, searchTerm])
        
        // 获取所有动态列的键并计算大致统一的宽度比例
        const keys = useMemo(() => {
            if (filteredData.length === 0) return []
            // 只取前 20 条找 key 避免不必要的超量运算
            return Array.from(new Set(filteredData.slice(0, 20).flatMap(obj => Object.keys(obj))))
        }, [filteredData])

        const virtualizer = useVirtualizer({
            count: filteredData.length,
            getScrollElement: () => parentRef.current,
            estimateSize: () => 40, // 估计固定单行高度 40px 左右
            overscan: 10,
        })

        if (filteredData.length === 0) return <div className="p-8 text-center text-muted-foreground">暂无 {title} 数据或无匹配搜索结果</div>

        return (
            <div className="border rounded-md relative flex flex-col h-[70vh] bg-background overflow-hidden">
                {/* 固定的表头 (保持可见不参与内部虚拟滚动逻辑) */}
                <div className="flex bg-muted text-muted-foreground text-xs uppercase shadow-sm z-10 font-semibold border-b shrink-0 overflow-y-scroll pr-4">
                    {keys.map(key => (
                        <div key={key} className="flex-1 min-w-[150px] max-w-[250px] px-4 py-3 truncate" title={key}>
                            {key}
                        </div>
                    ))}
                </div>

                {/* 虚拟滚动的视口容器 */}
                <div 
                    ref={parentRef} 
                    className="flex-1 overflow-auto w-full relative"
                >
                    <div
                        style={{
                            height: `${virtualizer.getTotalSize()}px`,
                            width: '100%',
                            position: 'relative',
                        }}
                    >
                        {virtualizer.getVirtualItems().map((virtualRow) => {
                            const row = filteredData[virtualRow.index]
                            return (
                                <div
                                    key={virtualRow.key}
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: `${virtualRow.size}px`,
                                        transform: `translateY(${virtualRow.start}px)`,
                                    }}
                                    className="flex border-b hover:bg-muted/50 transition-colors items-center"
                                >
                                    {keys.map(key => (
                                        <div 
                                            key={key} 
                                            className="flex-1 min-w-[150px] max-w-[250px] px-4 py-2 font-mono text-[11px] text-foreground truncate"
                                            title={String(row[key] ?? '')}
                                        >
                                            {row[key] !== null && row[key] !== undefined ? String(row[key]) : <span className="text-muted-foreground/50 italic">null</span>}
                                        </div>
                                    ))}
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div className="bg-muted/80 backdrop-blur text-xs px-4 py-2 text-right text-muted-foreground border-t shrink-0">
                    当前: {filteredData.length} 跳 / 总计: {data.length} 条物理数据
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background p-8 font-sans">
            <div className="max-w-screen-2xl mx-auto space-y-6">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight text-primary">System Database Inspector</h1>
                    <p className="text-muted-foreground text-sm">Advanced view for developer debugging. Virtualized with @tanstack/react-virtual for ultra-performance.</p>
                </div>

                <div className="bg-card border rounded-lg p-6 shadow-sm overflow-hidden">
                    <Tabs defaultValue="transactions" className="w-full flex flex-col">
                        <div className="flex justify-between items-center mb-6 gap-4 flex-wrap shrink-0">
                            <TabsList className="grid grid-cols-3 max-w-md">
                                <TabsTrigger value="transactions">Transactions</TabsTrigger>
                                <TabsTrigger value="accounts">Accounts</TabsTrigger>
                                <TabsTrigger value="categories">Categories</TabsTrigger>
                            </TabsList>
                            <input 
                                type="text" 
                                placeholder="🔍 全局搜索模型节点 (Value 匹配)..."
                                className="flex h-9 w-[300px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <TabsContent value="transactions" className="mt-0 flex-1">
                            <TableVirtualizer data={transactions} title="Transactions" />
                        </TabsContent>
                        
                        <TabsContent value="accounts" className="mt-0 flex-1">
                            <TableVirtualizer data={accounts} title="Accounts" />
                        </TabsContent>
                        
                        <TabsContent value="categories" className="mt-0 flex-1">
                            <TableVirtualizer data={categories} title="Categories" />
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    )
}
