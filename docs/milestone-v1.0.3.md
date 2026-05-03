# 里程碑 v1.0.3 — 导出优化与版本统一

## 任务目标
- [x] 支持桌面端导出时的位置询问与记忆。
- [x] 解决全站版本号不统一的问题。
- [x] 实现 Web/Tauri 环境下的自适应文件保存。

## 技术决策
1. **导出记忆实现**：
   - 弃用传统的 `<a>` 标签模拟下载，改用 `@tauri-apps/plugin-dialog` 的 `save` 方法。
   - 使用 `localStorage` 存储最后一次导出的**父级目录**。
   - 在下一次调用 `save` 时，拼接文件名作为 `defaultPath`，实现自动定位。

2. **版本号同步**：
   - 使用 Vite 的 `define` 特性，在构建时将 `package.json` 的 `version` 注入到全局常量 `__APP_VERSION__` 中。
   - 这种方式比硬编码更安全，且比 `import.meta.env` 更适合非环境变量场景。

3. **依赖更新**：
   - 新增 `tauri-plugin-dialog` 和 `tauri-plugin-fs`。
   - 均升级至 v2.0 系列以保持与 Vite 7 及 Tauri v2 的兼容性。

## 验证结果
- **Tauri 环境**：导出 JSON/TXT/XLSX 均能弹出原生窗口，且第二次打开时默认位置正确。
- **Web 环境**：在 Chrome 中通过 `showSaveFilePicker` 实现了原生保存体验；在不支持的浏览器中能正常回退到传统下载。
- **版本显示**：侧边栏和设置页均显示 `v1.0.3`。
