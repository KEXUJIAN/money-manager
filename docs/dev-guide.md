# 开发指南

| 版本 | 日期    | 变更说明                                                                       |
| ---- | ------- | ------------------------------------------------------------------------------ |
| v0.1 | 2026-02 | 初始创建                                                                       |
| v0.2 | 2026-02 | 新增数据管理模块说明、修正分隔符文档                                           |
| v0.3 | 2026-02 | 新增 SearchableSelect/DateTimePicker/Sonner 组件、分类防重与搜索、已知问题文档 |

## 快速上手

```bash
npm install
npm run dev          # 启动开发服务器 → http://localhost:5173/
npm run build        # TypeScript 检查 + 生产构建
npm run preview      # 预览生产构建
```

## 添加新功能的步骤

### 1. 新增数据表/字段

1. 修改 `src/db/index.ts` 中的 interface
2. 在 `db.version(N)` 中升级 schema（N 递增）
3. 如需种子数据，更新 `src/db/seed.ts`

### 2. 新增业务模块

在 `src/features/` 下创建目录：

```
src/features/your-feature/
├── components/     # 该模块的 React 组件
├── hooks/          # 自定义 hooks（如 useLiveQuery 封装）
└── index.ts        # 导出入口（可选）
```

### 3. 新增页面路由

1. 在 `src/routes/` 创建页面组件
2. 在 `src/App.tsx` 的 `<Routes>` 中添加路由
3. 在 `src/layouts/AppLayout.tsx` 的 `navItems` 数组中添加导航项

### 4. 新增 UI 组件

```bash
npx shadcn@latest add <component-name>
```

组件会安装到 `src/components/ui/`。

## 分类系统说明

- `isBuiltin: true` 的分类是内置分类，**不可删除**
- 用户通过设置页面新增的分类 `isBuiltin` 为 `undefined`，可以删除
- 收入和支出分类按 `type` 字段区分，同名分类在不同 type 下独立存在

## 历史数据导入

解析器位于 `src/features/import/importLegacy.ts`：

- 分隔符常量定义于 `src/lib/constants.ts`：`" \u0001 "`（空格 + SOH + 空格）
- 格式：`日期 \u0001 类别 \u0001 分类名 \u0001 金额 \u0001 备注`
- 金额取绝对值，类型由"支出/收入"字段决定
- 缺失的分类会自动创建

## 数据管理模块

位于 `src/features/data-management/`：

- **导出 JSON** — 完整备份所有数据
- **导出 TXT** — 兼容旧格式 (SOH 分隔)
- **导入 JSON** — 覆盖式恢复
- **导入 TXT** — 解析历史账单
- **清空数据** — 需二次确认 (ConfirmationModal)

## 代码规范

- **注释语言**：中文
- **注释原则**：只写 WHY，不写 WHAT
- **any 使用**：必须附带 `// any 理由：xxx`
- **错误处理**：所有异步操作必须 try/catch
- **依赖引入**：标准库能解决的（+50 行内），不引入第三方包
