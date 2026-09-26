# Better UI Imropvement 1.4.19

适配 Codex 26.924 系列的新侧栏和 renderer 模块拆分，恢复额度、会话菜单与公式预览。额度控件融入左侧窄导航栏，不再为会话列表增加独立底栏。

## 改进

- **紧凑额度控件**：在头像附近上下排列周期与剩余数值；悬停直接切换为重置星期和时刻，移开恢复数值，点击仍可切换额度类型。
- **保持列表空间**：移除独立额度底栏，避免遮挡会话或减少列表高度。Credit 和 API 模式保留各自含义，不虚构重置时间。

## 修复

- 原生 HTTP 客户端与 App Server 服务拆分到共享模块后，恢复真实额度读取和标题生成模型列表。
- 适配新版侧栏组件层级，恢复会话标题重新生成、Markdown 导出、永久删除入口以及项目右键“项目着色”子菜单。
- 从原生模块预加载记录发现 KaTeX，恢复行内、块级及表格中的公式预览，继续复用 Codex 自带的排版组件。

## 升级与验证

**支持并实际验证的 Codex 版本：26.924.1866.0（Windows）。** 其他版本未在本轮重新验证。

通过 Codex Script Loader 安装 `better-ui-imropvement-1.4.19.zip`，校验文件为同名 `.sha256`。设置和权限不变；Loader 与 Bridge 的修复由各自项目独立提供，不包含在本包中。Codex++ 支持仍止于 1.2.4。

语法检查与 34 项测试通过。已验收候选通过原位热加载，实际检查覆盖额度悬停与切换、项目右键菜单、会话菜单入口、斜杠菜单及公式/图片预览。未对真实会话执行永久删除、标题生成或导出落盘。

---

## English

This patch adapts to the Codex 26.924 sidebar and split renderer modules, restoring usage data, thread menus, and formula previews. The usage control fits into the narrow navigation rail without adding a footer to the chat list.

### Improved

- Show the usage period and remaining value in a compact control near the profile button. Hover to see the reset day and time, move away to restore the value, and click to switch usage types.
- Preserve chat-list space and avoid covering its last rows. Credit and API views retain their meaning without invented reset times.

### Fixed

- Discover native HTTP and App Server services in shared modules, restoring live usage data and the title-generation model catalog.
- Handle the updated sidebar component hierarchy so thread actions and the project-color context submenu are available again.
- Discover bundled KaTeX through native module-preload entries, restoring inline, display, and table formulas.

### Upgrading and validation

**Supported and verified Codex version: 26.924.1866.0 on Windows.** Other versions were not revalidated in this round.

Install `better-ui-imropvement-1.4.19.zip` through Codex Script Loader with its matching `.sha256` file. Settings and permissions are unchanged. Loader and Bridge fixes are maintained separately and are not included in this package. Codex++ support remains frozen at 1.2.4.

Syntax checks and 34 tests pass. The accepted candidate was hot-loaded and checked for usage hover/cycling, project context menus, thread-action entries, slash menus, and formula/image previews. Live thread deletion, title generation, and export-to-disk were not exercised.

**Full Changelog:** [v1.4.18...v1.4.19](https://github.com/JHees/better-ui-improvements-for-codex/compare/v1.4.18...v1.4.19)
