# Tauri 环境配置与运行指南 (Windows)

本指南将帮助你在 Windows 环境下配置 Tauri 开发环境并运行 Money Manager 桌面端。

## 1. 环境准备

### 1.1 安装 Microsoft Visual Studio C++ 生成工具
1. 下载 [Microsoft Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)。
2. 运行安装程序，勾选 **"C++ 桌面开发"** 工作负载。
3. 确保右侧安装详细信息中包含 **"Windows 10 SDK"** 或 **"Windows 11 SDK"**。
4. 点击安装并等待完成。

### 1.2 安装 Rust
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

### 1.3 安装 WebView2 (通常 Windows 10/11 已内置)
如果你使用的是较新的 Windows 10 或 Windows 11，系统通常已内置 WebView2。如果没有，请下载 [Evergreen Bootstrapper](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) 进行安装。

## 2. 项目配置

本项目已配置好 Tauri 相关的 `src-tauri` 目录，你无需重新初始化。

确保已安装项目依赖：
```powershell
npm install
```

## 3. 运行桌面端

在项目根目录下运行以下命令启动 Tauri 开发模式：

```powershell
npm run tauri dev
```

首次运行时，Rust 包管理器 (Cargo) 会下载编译依赖，这可能需要几分钟时间，请耐心等待。
启动成功后，将会弹出一个独立的应用程序窗口，即 Money Manager 的桌面端。

## 4. 常见问题

- **下载依赖慢**：
  可以在用户目录 (`~/.cargo/config`) 下配置国内镜像源（如字节跳动或清华源）加速 Cargo 下载。

- **构建报错**：
  请检查 `rustc` 和 `cargo` 是否在环境变量中，或者尝试更新 Rust: `rustup update`。
