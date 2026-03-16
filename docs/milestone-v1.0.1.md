# Milestone v1.0.1 - 职责分离重构

## 目标
解决首页底部流水列表加载时出现的冗余“记一笔”按钮，并优化组件架构。

## 已完成任务
- [x] **组件解耦**：将 `AddTransactionSheet` 拆分为 `TransactionFormSheet`（受控表单）和 `AddTransactionButton`（独立触发器）。
- [x] **UI 修复**：消除了 `TransactionList` 和 `TransactionsTable` 复用表单时带出的冗余按钮。
- [x] **全局同步**：更新了 `Home`、`TransactionList`、`TransactionsTable` 的所有组件引用。
- [x] **代码清理**：移除 `AddTransactionSheet.tsx` 中冗余的内部状态和触发逻辑，修复误删的必要导入。

## 技术决策
- **职责分离 (Separation of Concerns)**：
    - 鉴于 `Sheet` 组件在 Shadcn UI 中常被过度封装，我们选择显式分离 Trigger 和 Content。
    - `AddTransactionButton` 承载了“记一笔”在桌面端和移动端的双重表现形式，而 `TransactionFormSheet` 仅作为一个透明的数据录入容器。
- **平滑过渡**：保留了原文件的位置，但导出了更具语义化的组件名称。

## 验证结论
- **Desktop**: 首页侧边栏方案和统计页表格编辑依然完美。
- **Mobile**: 悬浮按钮位置和功能保持一致。
- **Bug Fix**: 首页底部按钮确认消失。
