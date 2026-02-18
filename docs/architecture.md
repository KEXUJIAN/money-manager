# 架构设计文档

| 版本 | 日期    | 变更说明                                                 |
| ---- | ------- | -------------------------------------------------------- |
| v0.1 | 2026-02 | 初始创建                                                 |
| v0.2 | 2026-02 | 新增 data-management 模块、lib/constants、CSS hsl() 变量 |

## 设计目标

Web 优先的跨平台个人记账应用，优先级：**Web > PC > Android > iOS**。

## 技术选型

| 层级     | 选型                       | 选型理由                                  |
| -------- | -------------------------- | ----------------------------------------- |
| 前端框架 | React 19 + TypeScript      | 生态最强，函数式心智模型                  |
| 构建     | Vite 7                     | 极速 HMR，ESM 原生支持                    |
| UI       | Shadcn/UI + Tailwind CSS 4 | 精美可控，无运行时开销                    |
| 数据库   | Dexie.js (IndexedDB)       | 异步、GB 级容量，Web/Tauri/Capacitor 通用 |
| 图表     | Recharts                   | React 生态最成熟的 SVG 图表库             |
| 表单     | react-hook-form + Zod      | 轻量、类型安全                            |
| 路由     | React Router v7            | 稳定、社区大                              |
| 桌面端   | Tauri v2                   | 比 Electron 轻量 10 倍，使用系统 WebView  |
| 移动端   | Capacitor（预留）          | 可将 Web App 直接包装成 APK               |

## 目录结构

```
src/
├── components/ui/      # Shadcn/UI 基础组件（Button, Card, Sheet 等）
├── db/                 # 数据层
│   ├── index.ts        # Dexie Schema: Account, Category, Transaction
│   └── seed.ts         # 内置分类（31 支出 + 27 收入）+ 默认账户
├── features/           # 业务功能模块
│   ├── accounts/       # 账户管理 — AccountCard, AccountList, AccountFormSheet
│   ├── data-management/ # 数据管理 — 导入/导出/清空 (JSON + TXT)
│   ├── import/         # 历史数据导入 — TXT 解析器 (SOH 分隔)
│   ├── stats/          # 统计 — MonthlyOverview, DailyChart, CategoryBreakdown
│   └── transactions/   # 交易 — AddTransactionSheet, TransactionList
├── layouts/            # AppLayout — 响应式侧边栏(桌面) / 底栏(移动)
├── lib/                # 工具函数 (cn) + 共享常量 (constants.ts)
├── routes/             # 页面路由 — Home, Stats, Settings
├── index.css           # 全局主题 (hsl 变量、渐变、自定义滚动条)
└── main.tsx            # 入口 + 数据库 seed
```

## 数据模型

```
Account
├── id: string (UUID)
├── name: string
├── type: 'cash' | 'bank' | 'alipay' | 'wechat' | 'credit_card' | 'other'
├── balance: number
└── currency: string

Category
├── id: string (UUID)
├── name: string
├── type: 'income' | 'expense' | 'transfer'
├── isBuiltin?: boolean    ← 内置分类不可删除
└── parentId?: string

Transaction
├── id: string (UUID)
├── amount: number         ← 始终为正数
├── type: 'income' | 'expense' | 'transfer'
├── accountId: string
├── toAccountId?: string   ← 转账目标
├── categoryId?: string
├── date: number           ← 时间戳
└── note?: string
```

## 性能策略

1. **IndexedDB 异步读写** — 不阻塞 UI
2. **useLiveQuery 替代 Zustand** — 数据变更自动触发重渲染，无需手动状态管理
3. **虚拟滚动预留** — `@tanstack/react-virtual` 已安装，长列表时可启用
4. **Web Worker 预留** — 年度报表等重计算可移至独立线程

## 跨平台策略

```
           ┌─ Web (浏览器直接访问)
React App ─┤
           ├─ PC (Tauri WebView2, 已配置)
           └─ Mobile (Capacitor, 预留)
```

同一份代码，数据层零修改。响应式布局通过 Tailwind 断点（`md:`, `lg:`）实现。
