# Milestone v0.6: 引入转账备忘机制并隔离财务统计

## 任务清单
- 摒弃了单边逻辑，采用原生双边信用消费对冲方案。
- 在 `Account` Schema 中新增了 `balanceOffset` 可选偏置字段，引入了纯净账本数学平账机制。
- 升级 `Transaction` Schema，新增 `transfer` 枚举与双边账户字段 (`transferToAccountId`)。
- 废除冗余的 `db.version(2)`，直接将结构覆盖回 `version(1)` 以保证前向纯洁。
- 升级解析器与导入核心跨表（TXT），解析结果中转账的账户识别为"目标账户"（转入方），金额取绝对值，自动指派专用的系统"未分配来源"账户（转出方）平账双边。
- 修改 `useStats.ts` 强行阻断过滤了 `transfer` 流水的收支计入。
- 恢复了记一笔时的原生转账卡片。
- 允许编辑账号时直接无痕平账从而影响 `balanceOffset` 并修改展现结果。
- 增强了 XLSX 导出和回归了标准 5 列的旧 TXT 导出，支持了双边结构。
- 将 UI 展现对齐，强化了流水大厅 `TransactionList` 的出入金双视角，以及重构了统计页明细 `TransactionsTable` 的双列表头。
- 重构了清空账户数据的级联算法以消灭双边转账孤岛。
- 引入了 `seed.ts` 防弹机制，改用静态确定的字符串（如 `builtin_expense_餐饮`）替换时间戳生成的伪随机分类 ID 解决数据重置乱码增殖问题。
- 新增 `importExcel.ts` 组件处理支持带环境强映射关系外键的 XLSX 报表全解析覆盖式导入。
- 修复了此前 XLSX 导出由于外键系统列硬编码导致的收入流水丢失"入金账户 ID"并污染出金对象的严重故障。
- **(高级特性)**：新增一个无痕诊断路由 `/dev-db` 用于直观审视 Dexie.js 数据底层，在主程序里隐藏不显示，程序员专用。
- **(追加需求)**：为 `/dev-db` 路由引入了返回系统主页辅助按键，并将该界面全盘中文化。
- **(追加需求)**：通过对核心 `AddTransactionSheet` 新增表单的解耦可控化改造，在 `TransactionsTable` 以及 `TransactionList` 明细列右侧引入了全局的流水**"编辑记录"**修改能力，底层自动通过 Dexie 事务实现"修改流水必先等比冲推双向原余额，再挂载新收支影响"的操作，达成账本余额与流水绝对对平。
- **(追加需求)**：新增单条流水的**"删除"**能力，抽离出共享工具函数 `deleteTransaction.ts`，在 Dexie 原子事务中先撤销余额影响再删除记录，配合确认对话框避免误操作。
- **(追加需求)**：针对 Vite 构建产物体积过大的问题（主 chunk 1,227 kB），实施了 **Chunk 分包与路由懒加载优化**：在 `vite.config.ts` 中通过 `manualChunks` 将 `react`、`recharts`、`framer-motion`、`radix-ui` 拆分为独立 vendor chunk；在 `App.tsx` 中将 4 个路由页面改为 `React.lazy` 按需加载。优化后主 chunk 降至 367 kB（↓70%），所有 chunk 均不超过 500 kB，警告消除。

## 技术决策
- 不再使用虚假流水进行历史平账，而是采用账户维度的数学偏置偏移 (`balanceOffset`)。
- 资金转移严格定义为出入双账户 `accountId` 与 `transferToAccountId`。
- 利息单独做支出记账，本金采用转移抵消。
- 分类系统初始化废弃 `bulkAdd` 转向幂等的 `bulkPut` 以允许防呆无限初始化而不爆破环境 ConstraintError。
- 表单导入解析策略由"名称降级制"变更为"系统ID强耦合匹配优先"，并支持挂载外部清洗 JSON 节点执行软历史替换。
- 利用路由空隙制造"开发者彩蛋模式"，保障界面纯洁性同时允许全状态实时穿透监视。
- 考虑到前端全量 DOM 渲染造成的初始同步卡顿，引入了 `@tanstack/react-virtual` 对海量底层调试明细进行了高帧率可变视口的虚拟滚动列表优化。
- 流水的编辑与删除操作均采用"先撤销原余额影响、再应用新变更/删除"的 Dexie 原子事务模型，确保任何变更都能保持余额与流水绝对一致。余额撤销逻辑抽离为共享函数 `deleteTransaction.ts` 供多处复用。
- 构建产物分包策略采用 `manualChunks` 按用途拆分 vendor 依赖（react 核心 / 图表库 / 动画库 / UI 组件库），配合路由级 `React.lazy` 懒加载实现按需加载，兼顾 Web 首屏性能和 Tauri 桌面端兼容性。
