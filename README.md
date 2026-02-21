# 💰 Money Manager — 个人记账管理

一款基于 Web 的个人记账应用，支持多账户管理、收支记录、数据统计和历史数据导入。

## ✨ 功能特性

- **多账户管理** — 现金、银行卡、支付宝、微信等，每种账户有独立渐变配色
- **快速记账** — 支出、收入一键切换，自动更新账户余额
- **分类体系** — 31 个支出分类 + 27 个收入分类内置，支持自定义扩展
- **数据统计** — 月度收支概览、每日趋势柱状图、分类饼图
- **数据管理** — JSON 导入/导出备份、历史 TXT 账单导入、一键清空
- **响应式设计** — 桌面端侧边栏 + 移动端底部导航栏

## 🛠 技术栈

| 层级   | 技术                       |
| ------ | -------------------------- |
| 框架   | React 19 + TypeScript      |
| 构建   | Vite 7                     |
| UI     | Shadcn/UI + Tailwind CSS 4 |
| 数据库 | Dexie.js (IndexedDB)       |
| 图表   | Recharts                   |
| 表单   | react-hook-form + Zod      |
| 路由   | React Router               |
| 桌面端 | Tauri（已配置）            |

## 🚀 快速开始

### 前置要求

- [Node.js](https://nodejs.org/) >= 18
- npm 或 pnpm

### 安装与运行

```bash
# 克隆项目
git clone <your-repo-url>
cd money-manager

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

浏览器打开 `http://localhost:5173/` 即可使用。

### 生产构建

```bash
npm run build
npm run preview
```

## 📂 项目结构

```
src/
├── components/ui/      # Shadcn/UI 基础组件
├── db/                 # Dexie.js 数据库定义与种子数据
│   ├── index.ts        # Schema (Account, Category, Transaction)
│   └── seed.ts         # 内置分类与默认账户
├── features/
│   ├── accounts/       # 账户管理（AccountCard, AccountList, AccountFormSheet）
│   ├── data-management/ # 数据管理（导入/导出/清空）
│   ├── import/         # 历史数据导入（TXT 解析器）
│   ├── stats/          # 统计模块（MonthlyOverview, DailyChart, CategoryBreakdown）
│   └── transactions/   # 交易管理（AddTransactionSheet, TransactionList）
├── layouts/            # AppLayout（响应式侧边栏/底栏）
├── lib/                # 工具函数 + 共享常量
├── routes/             # 页面路由（Home, Stats, Settings）
└── main.tsx            # 入口文件
```

## 📊 导入历史账单

支持从 TXT 文件导入历史记账数据（使用 `\u0001` SOH 字符作为分隔符）：

```
记账日期  消费类别  消费详情  消费金额  消费备注
2017-11-01 00:01  支出  餐饮  -3.00  早饭，花呗
```

在 **设置 → 数据管理 → 导入历史账单 (TXT)** 中选择文件即可自动解析导入。

## 📋 内置分类

### 支出分类（31 个）
餐饮、借款、通讯、购物、steam、果蔬、住房、日常、交通、还款、娱乐、基金、日用、旅行、办公、医疗、学习、发红包、美容、书籍、其他、捐款、运动、股票、红包、贷款、收入、报销、定金、理财、保险

### 收入分类（27 个）
餐饮、还款、理财、工资、其他、通讯、收红包、购物、报销、住房、steam、退款、交通、礼金、基金、医疗、娱乐、办公、日用、美容、果蔬、书籍、借款、红包、股票、旅行、贷款

> 内置分类不可删除，可在设置中自定义添加新分类。

## 🤖 AI 协作指南

本项目使用 AI 辅助开发。新开对话时，使用以下提示词让 AI 快速加载项目上下文：

### 首次加载（必做）

```
请先阅读以下项目文档，了解项目架构和开发规范，然后告诉我你已准备好：
- docs/architecture.md（架构设计）
- docs/dev-guide.md（开发指南）
```

### 继续开发（添加新功能）

```
请阅读 docs/ 下的项目文档，然后帮我实现 [你的需求]。
完成后请更新 docs/ 中的相关文档（如新建 milestone-v0.2.md）。
```

### 修改现有功能

```
请阅读 docs/architecture.md 和 docs/dev-guide.md，
然后查看 src/features/[模块名]/ 下的代码，帮我修改 [具体需求]。
```

### 文档维护规则

- **architecture.md** — 架构变更时更新（如新增数据表、引入新依赖）
- **dev-guide.md** — 开发流程变更时更新（如新增构建命令、代码规范调整）
- **milestone-vX.X.md** — 每个里程碑结束时新建，记录任务清单和决策
- **版本历史** — `architecture.md` 和 `dev-guide.md` 顶部必须维护版本历史表格，格式如下：

```markdown
| 版本 | 日期    | 变更说明      |
| ---- | ------- | ------------- |
| v0.1 | 2026-02 | 初始创建      |
| v0.2 | 2026-02 | 新增 xxx 模块 |
```

## 📝 License

MIT
