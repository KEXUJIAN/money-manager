# Tauri 环境配置与运行指南

本指南将帮助你在 Windows 和 macOS 环境下配置 Tauri 开发环境并运行 Money Manager 桌面端。

---

## Windows

### 1. 环境准备

#### 1.1 安装 Microsoft Visual Studio C++ 生成工具
1. 下载 [Microsoft Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)。
2. 运行安装程序，勾选 **"C++ 桌面开发"** 工作负载。
3. 确保右侧安装详细信息中包含 **"Windows 10 SDK"** 或 **"Windows 11 SDK"**。
4. 点击安装并等待完成。

#### 1.2 安装 Rust
Tauri 依赖 Rust 语言。

1. 访问 [Rust 官网](https://www.rust-lang.org/tools/install) 下载 `rustup-init.exe` (64位)。
2. 运行 `rustup-init.exe`。
3. 出现提示时，输入 `1` 并回车（选择默认安装: Default Host triple）。
4. 安装完成后，**重启终端** (PowerShell 或 CMD)。
5. 验证安装：
   ```powershell
   rustc --version
   cargo --version
   ```
   如果显示版本号，说明安装成功。

#### 1.3 安装 WebView2 (通常 Windows 10/11 已内置)
如果你使用的是较新的 Windows 10 或 Windows 11，系统通常已内置 WebView2。如果没有，请下载 [Evergreen Bootstrapper](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) 进行安装。

### 2. 项目配置

本项目已配置好 Tauri 相关的 `src-tauri` 目录，你无需重新初始化。

确保已安装项目依赖（包括必须的前端 API 和 Tauri CLI）：
```powershell
npm install
```

如果遇到 `npm ERR! Missing script: "tauri"` 错误，请确保 `package.json` 中的 `scripts` 节点包含 `"tauri": "tauri"`。

### 3. 运行桌面端

在项目根目录下运行以下命令启动 Tauri 开发模式：

```powershell
npm run tauri dev
```

首次运行时，Rust 包管理器 (Cargo) 会下载编译依赖，这可能需要几分钟时间，请耐心等待。
启动成功后，将会弹出一个独立的应用程序窗口，即 Money Manager 的桌面端。

### 4. 构建安装包

```powershell
npm run tauri build
```

产物路径：`src-tauri\target\release\bundle\`，包含 `.msi` 和 `.exe` 安装程序。

### 5. 常见问题

- **下载依赖慢**：
  可以在用户目录 (`~/.cargo/config`) 下配置国内镜像源（如字节跳动或清华源）加速 Cargo 下载。

- **构建报错**：
  请检查 `rustc` 和 `cargo` 是否在环境变量中，或者尝试更新 Rust: `rustup update`。

- **缺少 MSVC 链接器**：
  报错 `linker 'link.exe' not found` → 重新安装 Visual Studio Build Tools 并确认勾选了 C++ 桌面开发工作负载。

- **WebView2 缺失**：
  应用启动后白屏 → 手动下载安装 [WebView2 Runtime](https://developer.microsoft.com/en-us/microsoft-edge/webview2/)。

---

## macOS

### 1. 环境准备

#### 1.1 安装 Xcode Command Line Tools
Tauri 在 macOS 上依赖 Apple 的编译工具链（C/C++ 编译器、链接器等），这些工具包含在 Xcode Command Line Tools 中。

1. 打开 **终端 (Terminal.app)**。
2. 运行以下命令：
   ```bash
   xcode-select --install
   ```
3. 弹出对话框后，点击 **"安装"**，等待下载完成（约 1-2 GB）。
4. 验证安装：
   ```bash
   xcode-select -p
   ```
   如果输出类似 `/Library/Developer/CommandLineTools` 或 `/Applications/Xcode.app/Contents/Developer`，说明安装成功。

> **注意**：你不需要安装完整的 Xcode IDE，仅安装 Command Line Tools 即可。

#### 1.2 安装 Rust
Tauri 依赖 Rust 语言。

1. 打开 **终端 (Terminal.app)**。
2. 运行官方安装脚本：
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```
3. 出现提示时，输入 `1` 并回车（选择默认安装）。
4. 安装完成后，执行以下命令使环境变量生效（或**重启终端**）：
   ```bash
   source "$HOME/.cargo/env"
   ```
5. 验证安装：
   ```bash
   rustc --version
   cargo --version
   ```
   如果显示版本号，说明安装成功。

#### 1.3 关于 WebView (无需额外安装)
macOS 自带 WebKit (Safari 引擎)，Tauri 在 macOS 上直接使用系统内置的 `WKWebView`，**无需额外安装任何依赖**。

### 2. 项目配置

本项目已配置好 Tauri 相关的 `src-tauri` 目录，你无需重新初始化。

确保已安装项目依赖（包括必须的前端 API 和 Tauri CLI）：
```bash
npm install
```

如果遇到 `npm ERR! Missing script: "tauri"` 错误，请确保 `package.json` 中的 `scripts` 节点包含 `"tauri": "tauri"`。

### 3. 运行桌面端

在项目根目录下运行以下命令启动 Tauri 开发模式：

```bash
npm run tauri dev
```

首次运行时，Rust 包管理器 (Cargo) 会下载编译依赖，这可能需要 5-10 分钟时间，请耐心等待。
启动成功后，将会弹出一个独立的应用程序窗口，即 Money Manager 的桌面端。

> **提示**：macOS 可能会弹出 "是否允许此应用接受传入网络连接" 的提示，点击 **"允许"** 即可。

### 4. 构建安装包

```bash
npm run tauri build
```

产物路径：`src-tauri/target/release/bundle/`，包含：
- `.dmg` — 磁盘映像安装包（用户双击挂载后拖入应用程序文件夹）
- `.app` — 应用程序包（可直接运行）

### 5. 常见问题

- **下载依赖慢**：
  可以在用户目录 (`~/.cargo/config.toml`) 下配置国内镜像源（如字节跳动或清华源）加速 Cargo 下载。配置示例：
  ```toml
  [source.crates-io]
  replace-with = 'tuna'

  [source.tuna]
  registry = "https://mirrors.tuna.tsinghua.edu.cn/git/crates.io-index.git"
  ```

- **构建报错**：
  请检查 `rustc` 和 `cargo` 是否在环境变量中，或者尝试更新 Rust: `rustup update`。

- **报错 `xcrun: error: invalid active developer path`**：
  说明 Xcode Command Line Tools 未安装或已损坏，重新执行 `xcode-select --install`。

- **macOS Gatekeeper 阻止运行**：
  双击 `.app` 时提示 "无法打开，因为无法验证开发者" → 右键点击应用 → 选择 **"打开"** → 点击 **"打开"** 确认。或在「系统设置 → 隐私与安全性」中允许运行。

---

## 通用说明

- **仅前端模式**：所有数据存储在浏览器 IndexedDB 中，与 Tauri 完全解耦。运行 `npm run dev` 即可在浏览器中独立使用，无需启动 Tauri 桌面端。
- **端口 5173 被占用**：Vite 会自动切换到下一个可用端口，Tauri 会自动检测，通常无需手动处理。
- **跨平台兼容**：本项目前端和 Tauri 后端代码均无平台特定逻辑，Windows 和 macOS 可使用同一份源码，无需任何代码修改。
