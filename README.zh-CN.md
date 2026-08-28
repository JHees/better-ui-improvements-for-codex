<div align="center">

# Better UI Improvements for Codex

**通过 Codex Script Loader 持续维护的 Bennett UI 界面与工作流增强脚本。**

[![Version](https://img.shields.io/badge/version-1.4.12-14b8a6)](https://github.com/JHees/better-ui-improvements-for-codex)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Runtime](https://img.shields.io/badge/runtime-Codex%20Script%20Loader-111827)](https://github.com/JHees/codex-script-loader)
[![Mode](https://img.shields.io/badge/mode-renderer--only-7c3aed)](#兼容性)

[English](README.md) · **简体中文**

</div>

Bennett UI Improvements 1.4.12 是适用于 [Codex Script Loader](https://github.com/JHees/codex-script-loader) 的 renderer-only 插件。它将项目化侧栏、真实额度显示、Markdown 预览增强、压缩上下文标题生成、原生会话导出和永久删除以及独立设置面板整合为一个可直接安装的脚本。

本项目最初由 [b-nnett/codex-plusplus-bennett-ui](https://github.com/b-nnett/codex-plusplus-bennett-ui) 迁移而来，保留原作者与 MIT 许可证声明；现在由 [JHees](https://github.com/JHees) 面向 Codex Script Loader 继续维护。

> [!IMPORTANT]
> **Codex++ 支持已止于 `1.2.4`。** 这是 BigPizzaV3 Codex++ Script Market 最后收录的 Bennett 版本。`1.2.4` 之后的版本（包括当前 `1.4.12`）面向 Codex Script Loader；本仓库不再为 Codex++ 发布新版本、提供兼容性修复或进行测试。

## 功能亮点

| 领域 | 提供的能力 |
| --- | --- |
| 侧栏 | 项目和会话颜色、项目颜色控制和斜杠菜单优化。 |
| 额度 | 真实的 5 小时与 Weekly 额度、可选 Credit、重置时间提示和明确的 `API` 模式。 |
| 历史会话 | 普通会话和项目会话都交由 Codex 原生的独立分页范围管理。 |
| Markdown | 为 `.md` 预览补充 KaTeX 公式与本地/相对图片，表格、链接和排版继续使用 Codex 原生能力。 |
| 会话操作 | 在 Codex 自带会话右键菜单中增加压缩上下文标题重新生成、Markdown 导出和确认式永久删除，同时保留原生项目移动。 |
| 设置 | 独立 Bennett UI 设置页，集中管理功能开关。 |
| 降低干扰 | 隐藏 Codex 额度耗尽提示和 Plus/Pro 升级提示，同时保留输入框和 Codex 软件更新提示。 |

## 安装

### 通过 Codex Script Loader

本插件独立于 [Codex Script Loader](https://github.com/JHees/codex-script-loader) 发布。Loader 仓库不再内置、镜像、版本化或部署 Bennett UI。

先运行 `npm test` 和 `npm run check`，再生成可安装 ZIP：

```powershell
npm run package
```

在 Loader 设置页安装生成的 `dist/bennett-ui-improvements-<version>.zip`。开发时也可以直接选择本仓库根目录作为插件包，因为 [`manifest.json`](manifest.json) 会指向唯一主源码 [`scripts/bennett-ui-improvements.js`](scripts/bennett-ui-improvements.js)。源码、清单、测试、版本与发布全部由本仓库独立维护。

打包命令还会生成 `dist/bennett-ui-improvements-<version>.zip.sha256`，稳定版 tag 会同时发布这两个文件。此前已安装的 Bennett `1.4.11` 包不含更新声明，因此需要手动安装一次未来首个带 tag 的 update-aware ZIP；迁移完成后，Loader 才能发现后续稳定版 GitHub Release。自动替换仍需用户为本插件单独开启；检查更新本身不会开启自动更新。

### 旧版 Codex++ 安装

Codex++ 用户仍可继续使用市场中冻结的 `1.2.4`，但该版本已停止支持，也不会再从本仓库获得更新。请勿把更新版本安装到 Codex++，也不要把新版本提交到其 Script Market。

## 功能清单

| 功能 | 默认状态 | 支持情况 |
| --- | ---: | --- |
| 项目背景和颜色 | 开启 | 稳定 |
| 会话项目着色 | 开启 | 已归属项目的会话稳定可用；普通对话保持默认样式 |
| 5 小时 / Weekly / Credit 额度 | 开启 | 当前页面能提供额度数据时稳定可用 |
| 隐藏额度耗尽提示 | 开启 | 稳定 |
| 隐藏 Plus/Pro 升级提示 | 开启 | 稳定；保留 Codex 软件更新提示 |
| 公式与本地图片预览 | 开启 | 对 `.md` 和 `.markdown` 预览稳定可用；不接管原生表格 |
| 斜杠菜单优化 | 开启 | 稳定 |
| 会话标题重新生成 | 开启 | 本地非临时会话；在临时分支压缩完整上下文后使用 Luna low |
| 会话 Markdown 导出 | 开启 | 本地非临时会话；直接使用 Codex 原生 App Server |
| 会话永久删除 | 开启 | 本地非临时会话；不可恢复且必须明确确认 |

所有功能开关都位于 **Codex 设置 → Script-Loader → 界面增强**。设置保存在本地，重新加载脚本不会覆盖用户选择。1.4.11 恢复了通过 Codex renderer HTTP 服务获取额度，并隐藏了置顶会话行中重复出现的前置会话图标。插件声明的设置页继续复用当前 Codex 设置页的布局、字体、卡片、控件和滚动容器。标题生成继续使用 system 来源的临时工作分支，只接受本次新增且已完成的原生压缩 turn，并只屏蔽精确匹配临时分支的完成通知。Markdown 表格、链接和排版仍交由 Codex 原生预览，项目颜色偏好会从旧版 Codex++ 存储命名空间迁移到 Script Loader 命名空间。

项目颜色通过项目自带右键菜单中的 **项目着色** 二级菜单修改。每个颜色选项同时显示文字和颜色样例：“自动”继续按项目名称分配颜色，“无颜色”恢复项目及其会话的 Codex 原生样式。Codex 提供稳定项目 ID 时，手动选择会优先绑定该 ID，并保留项目名称作为兼容回退。插件只向 Codex 的项目菜单数据追加该子菜单，不替换或遮挡原生右键菜单。

会话着色必须取得 Codex 的稳定项目 ID。普通会话中显示的工作目录名称不会再被视为项目归属。

## 原生会话右键操作

- **移动到项目**和**移出项目**继续使用 Codex 原生实现，Bennett 不重复添加或替换。
- **重新生成标题**会创建 system 来源的临时工作分支，在该分支上触发 Codex 原生压缩，再让 `gpt-5.6-luna` low 在同一压缩上下文中生成结构化标题；结束后永久删除工作分支，原会话不会被压缩或追加消息。
- **导出 Markdown**位于原生分享和复制操作附近，按时间顺序导出用户与助手文本，并保留本地图片路径标记；系统/开发者上下文、推理和工具载荷不会写入文件。
- **永久删除**位于菜单最底部并使用危险操作样式，必须明确确认；它调用 Codex 原生 `thread/delete`，不提供 Bennett 或 Codex++ 备份与撤销。
- 三项功能各有独立开关。任一功能启用时，会隐藏 Codex++ 旧的行内“更多/删除”按钮，但不会影响 Codex 原生的置顶和归档按钮。
- 三项功能直接调用本地 Codex App Server，不依赖 Codex++ 会话删除 bridge 或 helper 服务。

## 会话项目着色

- 普通侧栏、展开的项目列表以及有限筛选结果中的会话，会继承所属项目的颜色。
- 使用低对比度背景和左侧色条，保持标题、选中状态和未读提示清晰可读。
- 无法确认项目归属的会话保持 Codex 默认样式。
- 可在 **Codex 设置 → Script-Loader → 界面增强** 中单独开启或关闭；项目颜色设置会自动同步到会话。
- 修改项目颜色后，当前已显示的会话颜色会立即同步更新。

## Codex 原生会话分页

当前 Codex 版本自行负责会话发现、项目分组和分页。Bennett 不再调用私有历史刷新模块，也不再提供独立历史上限。

- **最近**区域使用 Codex 的无项目会话无限滚动范围。
- 每个项目都有独立的项目 catalog；展开项目后由 Codex 单独加载更早的项目会话。
- 置顶会话继续保留在 Codex 独立的置顶容器中。
- 启用 CC Switch 的“同步会话”后，历史合并仍由 CC Switch/Codex 管理；Bennett 既不读取会话文件，也不会创建第二份会话数据库。

## 额度数据规则

- 启动后不会把保存的旧额度快照当作当前数据展示。
- 只接受当前 `/wham/usage` 返回的主账户数据；不会使用旧快照、renderer 事件或页面文本作为额度来源。
- 5 小时和 Weekly 显示剩余百分比，悬停可查看重置时间。
- 额度控件只读取主账户 `rate_limit`；`additional_rate_limits`（例如 GPT-5.3 Codex 专属额度）不会被合并进主账户额度。
- 只有真实收到 Credit 数据时才显示点数。
- API 或纯 API provider 显示 `API`，不会伪造 ChatGPT 官方额度。
- `market-hide-usage-alert.js` 的功能已经内置，不再需要单独安装。

## 额度提示过滤

- 隐藏 Codex 额度耗尽提示和升级提示，同时保留会话正文、输入框及软件更新提示。
- 支持 Codex 主界面和内嵌 ChatGPT 页面中的相关提示。
- 可在 **Codex 设置 → Script-Loader → 界面增强** 中启用或关闭。

## Markdown 预览增强

右侧 Markdown 预览增强仅负责：

- 行内与块级公式：`$...$`、`$$...$$`、`\(...\)` 和 `\[...\]`。
- 使用 Codex 内置 KaTeX，不依赖外部数学公式 CDN。
- 根据当前文档解析本地和相对图片路径。
- 选择已渲染公式并查看对应 LaTeX 源码。

Markdown 表格、链接、换行和列宽继续由 Codex 原生预览负责。`$25` 这样的货币金额不会被当成公式分隔符。

![Markdown 预览中的行内与块级公式渲染效果](docs/images/markdown-preview-math.png)

## 兼容性

Bennett UI 通过 Codex Script Loader 运行，不会修改 Codex 官方安装文件。Codex 大版本更新后，依赖界面的功能可能需要适配。Codex++ `1.2.4` 仅作为历史上的最后受支持版本保留；当前兼容性工作只面向 Codex Script Loader。

## 可选附加脚本

[`scripts/hidden-user-message-visibility-fix.js`](scripts/hidden-user-message-visibility-fix.js) 是独立的兼容性修复，用于恢复因会话压缩或 steering 渲染异常而被隐藏的用户消息，不属于 Bennett UI 主脚本。

## 来源与许可

- 原始项目：[b-nnett/codex-plusplus-bennett-ui](https://github.com/b-nnett/codex-plusplus-bennett-ui)
- 当前运行时：[JHees/codex-script-loader](https://github.com/JHees/codex-script-loader)
- Codex++ 市场历史版本（`1.2.4`）：[BigPizzaV3/CodexPlusPlusScriptMarket](https://github.com/BigPizzaV3/CodexPlusPlusScriptMarket)
- 当前维护仓库：[JHees/better-ui-improvements-for-codex](https://github.com/JHees/better-ui-improvements-for-codex)

项目使用 [MIT License](LICENSE)。原始版权、来源与许可声明保留在发布脚本和 [`NOTICE.md`](NOTICE.md) 中。
