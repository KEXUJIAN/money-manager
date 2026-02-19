# 已知问题与解决思路

## 1. DateTimePicker 日历宽度过窄

**现象**：时间选择器弹出后，日历区域格子紧凑、整体偏窄，视觉观感不佳。

**根因**：`calendar.tsx` 组件内部硬编码了 `[--cell-size:2rem]` 和 `w-fit`。通过外部 `className` 或 `style` 传入更大的 `--cell-size` 虽然能放大单元格，但 `w-fit` 约束了外层容器不会随之撑开，导致日历被裁切或仍显窄。

**解决思路**：
- 直接修改 `src/components/ui/calendar.tsx`，将默认 `--cell-size` 从 `2rem` 改为 `2.25rem` 或 `2.5rem`
- 同时移除或调整 `w-fit` 约束，让日历宽度随格子大小自适应
- 注意：此修改是全局的，会影响所有使用 Calendar 组件的地方，需统一验证

**优先级**：低（功能不受影响，仅外观）

---

## 2. Popover 在 Sheet 内的 z-index 层级管理

**现象**：SearchableSelect 和 DateTimePicker 的 Popover 在 Sheet 内打开时，最初无法点击。

**已修复方案**：
- Popover 添加 `modal` 属性
- PopoverContent 的 z-index 提升至 `z-[200]`（Sheet overlay 为 `z-[100]`，Sheet content 为 `z-[101]`）

**遗留风险**：
- 如果未来有更多嵌套弹出层（如 Popover 内再开 Select），可能再次出现 z-index 冲突
- 长期方案：统一项目的 z-index 分层策略，在 `index.css` 中定义 `--z-sheet`、`--z-popover`、`--z-dropdown` 等层级变量

---

## 3. DateTimePicker 内部 Select 嵌套问题

**现象**：最初 DateTimePicker 内时/分选择器使用 Radix Select，但 Select 的 Portal 渲染在 Popover 外部，被 Sheet overlay 遮挡。

**已修复方案**：将 Radix Select 替换为自实现的内联 TimeWheel 滚动列表，不使用 Portal，彻底避免嵌套 Portal 的 z-index 冲突。

**备注**：若未来需要在 Sheet 内使用 Select，可考虑给 SelectContent 传入 `className="z-[300]"` 的方式临时解决。
