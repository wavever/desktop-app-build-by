## buildby

检测 macOS 与 Windows 上桌面应用所使用的技术栈。

可以快速看出一个应用是使用 **原生技术**（Swift、Objective‑C、Win32 等），还是使用 **跨平台框架**（Electron、Flutter、Tauri、Qt、JVM、CEF、NW.js、React Native、wxWidgets 等）构建的。

## 截图
![](/screenshot/img-app.png)
![](/screenshot/img-scan.png)

### 安装

```bash
# 从 npm 安装
npm i -g desktop-app-build-by

# 克隆仓库并全局链接
git clone <repo>
cd desktop-app-build-by
npm install
npm link

# 或直接运行
node bin/buildby.js <command>
```

### 用法

#### 查看单个应用

```bash
buildby wechat
buildby discord
buildby "visual studio code"
buildby "clash verge"
```

输出示例：

```text
  Discord
  /Applications/Discord.app

   跨平台    ⚡ Electron

  使用 Web 技术（HTML/CSS/JS）构建的跨平台桌面应用
  https://www.electronjs.org

  检测依据：
    • Electron Framework.framework
    • app.asar

  Bundle ID：com.hnc.Discord
  版本：0.0.335
  大小：xxx MB
```

#### 扫描所有已安装应用

```bash
buildby --scan
```

会扫描 `/Applications`（macOS）或 `Program Files`（Windows）等目录下的所有桌面应用，按技术栈分组，并展示“技术栈分布”统计条形图。

#### 按技术栈过滤

```bash
buildby --electron      # 所有 Electron 应用
buildby --flutter       # 所有 Flutter 应用
buildby --tauri         # 所有 Tauri 应用
buildby --qt            # 所有 Qt 应用
buildby --wxwidgets     # 所有 wxWidgets/wxPython 应用
buildby --jvm           # 所有 JVM 应用（Java/Kotlin/Scala）
buildby --cef           # 所有 CEF (Chromium Embedded Framework) 应用
buildby --dotnet        # 所有 .NET / MAUI / WPF 应用
buildby --nwjs          # 所有 NW.js 应用
buildby --reactnative   # 所有 React Native 桌面应用
buildby --native        # 所有原生应用（Swift/ObjC/Win32）
```

#### 指定自定义路径

```bash
buildby --path /Applications/SomeApp.app
buildby --path "C:\Program Files\SomeApp"
```

### 支持检测的技术栈

| 栈 | 说明 | 主要检测方式 |
|----|------|--------------|
| ⚡ **Electron** | Node.js + Chromium | `Electron Framework.framework`、`app.asar` |
| 🐦 **Flutter** | Google 跨平台 UI 工具包 | `FlutterMacOS.framework`、`flutter_windows.dll` |
| 🌐 **CEF** | Chromium Embedded Framework | `Chromium Embedded Framework.framework`、`libcef.dll` |
| 🦀 **Tauri** | Rust + 系统 WebView | `otool -L` 检测 `WebKit.framework` + 资源目录 / Windows 上 `WebView2Loader.dll` |
| 🔷 **Qt** | C++ 跨平台框架 | `Qt*.framework`、`Qt5Core.dll` / `Qt6Core.dll` |
| 🧩 **wxWidgets** | C++ 跨平台 GUI 库 | macOS 上 `libwx*.dylib`，Windows 上 `wxmswXXu_*.dll` 等 |
| ☕ **JVM** | Java/Kotlin/Scala | `jbr/`、`libjvm.dylib`、大量 `.jar` 文件 |
| 🔵 **.NET** | Microsoft .NET / MAUI / WPF | `MonoBundle/`、`coreclr.dll`、`.dll` 组合特征 |
| 🟩 **NW.js** | Node.js + Chromium（原 node‑webkit） | `nwjs Framework.framework`、`app.nw` |
| ⚛️ **React Native** | React Native 桌面端实现 | `React.framework`、`Hermes.framework` / `hermes.dll` |
| 🖥️ **Native** | 平台原生技术 | 未命中任何跨平台特征时的兜底分类 |

### 平台支持

| 平台 | 应用发现位置 | 检测方式 |
|------|--------------|----------|
| macOS | `/Applications`、`~/Applications` | `Contents/Frameworks`、`Contents/Resources`、`otool -L`、`Info.plist` 元数据 |
| Windows | `Program Files`、`Program Files (x86)`、`AppData/Local/Programs` | 扫描 `.exe` / `.dll`、特定框架文件与目录结构 |

### 工作原理（简要）

检测完全基于 **文件系统**，不会做反汇编，也不需要管理员权限：

1. **扫描框架目录**：读取 `Contents/Frameworks/` 或应用目录下的 DLL，匹配各类已知框架的特征文件。  
2. **资源文件模式**：查找 `app.asar`、`flutter_assets`、`app.nw` 等典型文件。  
3. **JVM / .NET / 其他运行时检测**：识别打包的 JRE/JBR、.NET 运行时以及关联目录结构。  
4. **Tauri / wxWidgets 等特定栈**：结合 `otool -L` / DLL 名称 + 资源分布做多信号判断。  
5. **元数据提取**：从 `Info.plist` 解析 Bundle ID、版本号和展示名称。  
6. **兜底策略**：如果未匹配到任何跨平台特征，则将应用归类为原生技术栈。

检测按照优先级顺序依次执行，特征越独特的框架越先匹配，以减少误报和重复分类。

### 环境要求

- Node.js >= 18  
- 当前系统为 macOS 或 Windows  
- macOS 上需要可用的 `otool`（Xcode Command Line Tools 自带，用于部分框架检测）

### 许可证

MIT

