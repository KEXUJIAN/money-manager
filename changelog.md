# 更新日志 (Changelog)

所有项目变更均在此记录。

## [1.0.1] - 2026-03

### Added
- **文档规范优化**：将分散在 `architecture.md` 和 `dev-guide.md` 中的版本历史迁移至统一的 `changelog.md`。
- **职责分离重构**：将 `AddTransactionSheet` 拆分为 `TransactionFormSheet`（受控表单）和 `AddTransactionButton`（独立触发器）。

### Fixed
- **UI 修复**：消除了 `TransactionList` 和 `TransactionsTable` 复用表单时带出的冗余“记一笔”按钮。

---

## [1.0.0] - 2026-03

### Added
- **核心功能完成**：支持多账户管理、收支记录、数据统计和历史数据导入。
- **原生双边转账**：实现账户间的资金划转逻辑。
- **原子平账事务**：引入 `balanceOffset` 机制，支持余额的手动修正与对账。
- **性能优化**：
  - 路由懒加载与 `manualChunks` 分包，显著降低首屏体积。
  - IndexedDB 异步读写，保证 UI 流畅。
- **数据管理**：支持 JSON 完整备份与 TXT (SOH 分隔) 历史账单导入导出。
- **中文化适配**：完成 DevDB 开发者工具的中文化及交互优化。

### Changed
- **历史归档**：合并 v0.1 至 v0.6.2 的所有早期开发记录。
  - v0.1 - v0.2: 初始架构与基础模块。
  - v0.3 - v0.4: UI/UX 进阶与图表重构。
  - v0.5 - v0.6: 核心功能完善与稳定版。
