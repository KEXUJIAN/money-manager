# 更新日志 (Changelog)

所有项目变更均在此记录。

## [1.0.3] - 2026-05

### Added
- **导出位置记忆**：桌面端（Tauri）导出时现在可以记住上一次选择的文件夹位置，显著提升连续备份/导出的体验。
- **环境自适应保存**：引入 `fileService` 抽象层，在桌面端调用原生对话框，在 Web 端自动回退到浏览器下载或 `File System Access API`。

### Fixed
- **版本号全站同步**：修复了 `package.json`、`tauri.conf.json` 以及页面（侧边栏、设置页）版本号不一致的问题，现通过 Vite `define` 机制实现统一管理。
- **导出任务状态**：统一了 TXT 和 XLSX 导出的 Loading 状态反馈。

## [1.0.2] - 2026-04

### Added
- **全局记账入口**：重构记账按钮为全局悬浮按钮（FAB），随时随地快速“记一笔”。
- **快捷搜索支持**：收支分类现已支持通过拼音检索（基于 `pinyin-match`），提升交互效率。

### Changed
- **布局重组**：从具体的页面层中解耦了记账入口，并统一交由 `AppLayout` 全局状态托管。

---

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
