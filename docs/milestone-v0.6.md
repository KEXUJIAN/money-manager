# Milestone v0.6: 引入转账备忘机制并隔离财务统计

## 任务清单
- 摒弃了单边逻辑，采用原生双边信用消费对冲方案。
- 在 `Account` Schema 中新增了 `balanceOffset` 可选偏置字段，引入了纯净账本数学平账机制。
- 升级 `Transaction` Schema，新增 `transfer` 枚举与双边账户字段 (`transferToAccountId`)。
- 废除冗余的 `db.version(2)`，直接将结构覆盖回 `version(1)` 以保证前向纯洁。
- 升级解析器与导入核心跨表（TXT），解析结果中转账的账户识别为“目标账户”（转入方），金额取绝对值，自动指派专用的系统“未分配来源”账户（转出方）平账双边。
- 修改 `useStats.ts` 强行阻断过滤了 `transfer` 流水的收支计入。
- 恢复了记一笔时的原生转账卡片。
- 允许编辑账号时直接无痕平账从而影响 `balanceOffset` 并修改展现结果。
- 增强了 XLSX 导出和回归了标准 5 列的旧 TXT 导出，支持了双边结构。
- 将 UI 展现对齐，强化了流水大厅 `TransactionList` 的出入金双视角，以及重构了统计页明细 `TransactionsTable` 的双列表头。
- 重构了清空账户数据的级联算法以消灭双边转账孤岛。
- 引入了 `seed.ts` 防弹机制，改用静态确定的字符串（如 `builtin_expense_餐饮`）替换时间戳生成的伪随机分类 ID 解决数据重置乱码增殖问题。
- 新增 `importExcel.ts` 组件处理支持带环境强映射关系外键的 XLSX 报表全解析覆盖式导入。

## 技术决策
- 不再使用虚假流水进行历史平账，而是采用账户维度的数学偏置偏移 (`balanceOffset`)。
- 资金转移严格定义为出入双账户 `accountId` 与 `transferToAccountId`。
- 利息单独做支出记账，本金采用转移抵消。
- 分类系统初始化废弃 `bulkAdd` 转向幂等的 `bulkPut` 以允许防呆无限初始化而不爆破环境 ConstraintError。
- 表单导入解析策略由“名称降级制”变更为“系统ID强耦合匹配优先”，并支持挂载外部清洗 JSON 节点执行软历史替换。
