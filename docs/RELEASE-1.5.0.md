# Better UI Imropvement 1.5.0

本版集中改进 Codex 新版界面的菜单、侧栏控件和插件设置体验。

## 改进与修复

- 修复新版会话菜单的发现与回调更新，保留原生确认和会话操作行为。
- 改进斜杠菜单分组、收藏、滚动和键盘选择，减少界面更新时的重复扫描。
- 切页时复用并立即挂回侧栏额度与外观按钮，避免等待额度请求完成后才显示。
- 额度类型会记住上次选择；启动时点数数据尚未返回，也不会把“点数”重置为 5 小时。
- 设置页整合自定义配色、布局与预览，为需要解释的选项保留简短说明，并使用新的分栏面板图标。
- 保留隐藏原生“用量”按钮、公式与本地图片预览、标题生成、Markdown 导出及原生永久删除确认。

## 升级与验证

通过 Loader 自动更新或安装本版 ZIP；设置沿用现有存储。仅支持 Codex Script Loader，Codex++ 市场最后支持版本仍为 1.2.4。

静态检查、90 项测试和独立打包通过；候选已实际热加载，检查了设置页、实例替换、额度选择保留和重复节点。没有宣称完成前台逐帧闪烁测量。

资产：`better-ui-imropvement-1.5.0.zip` 及同名 `.sha256` 校验文件。

---

This release improves menus, sidebar controls and settings in the newer Codex interface.

- Restores native conversation-menu discovery and callback updates while preserving native confirmations and actions.
- Improves slash-menu grouping, favorites, scrolling and keyboard selection with fewer redundant scans.
- Reuses sidebar usage and appearance controls immediately after page changes, independently of quota requests.
- Remembers the selected quota type even when credit data has not arrived during startup.
- Consolidates palette editing, layout and preview, adds short explanations where needed, and replaces the settings icon with a panel symbol.
- Retains native Usage-button hiding, math/local-image previews, title generation, Markdown export and native permanent-delete confirmation.

Update through Loader or install the ZIP; existing settings remain in their current storage. Codex Script Loader is the supported runtime; Codex++ support ended at 1.2.4.

Validation passed static checks, 90 tests and package creation. The candidate was hot-loaded and checked for settings layout, instance replacement, retained quota selection and duplicate controls. Foreground frame-by-frame flicker measurement was not completed.

Assets: `better-ui-imropvement-1.5.0.zip` and its `.sha256` file.

[Full Changelog](https://github.com/JHees/better-ui-improvements-for-codex/compare/v1.4.26...v1.5.0)
