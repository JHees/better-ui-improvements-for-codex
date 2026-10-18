# Better UI Imropvement 1.4.25

修复斜杠菜单滚动卡顿，并让项目与关联会话的颜色在图片预览遮罩打开时保持稳定。同时减少聊天更新引起的无关扫描和菜单关闭后的资源残留。

## 修复与改进

- 修复 [#4](https://github.com/JHees/better-ui-improvements-for-codex/issues/4)：收藏图标未变化时不再重建，切断 DOM 监听触发的重复刷新；滚动复用分组信息，不再遍历和装饰全部命令。
- 移除斜杠菜单的重复定时扫描和鼠标移动时成批排队的检查；菜单关闭或列表被替换时释放监听、动画和缓存。
- Markdown 预览、斜杠菜单、额度提示和会话菜单只响应相关区域的变化，避免聊天文本更新带动无关扫描。内嵌页面的额度提示监听只在初始化或页面导航后安装。
- 项目与关联会话着色不再依赖可见性、可交互状态或节点尺寸。打开图片预览等遮罩时保留颜色，配色未变化时不重复写入样式。
- 修复同名项目着色遗漏，以及修改一个项目颜色时影响其他项目菜单挂载的问题。连续更新不再无限推迟侧栏、会话菜单和升级提示的处理。
- 保留此前 1.4.24 修复包中的后台删除行为；本次标签、源码和插件包统一包含这些修复。

## 升级

已安装用户可在 Codex Script Loader 中检查插件更新；开启自动更新的用户可使用自动更新。也可下载 `better-ui-imropvement-1.4.25.zip`，用配套 `.zip.sha256` 校验后通过 Loader 安装，无需先卸载。已有设置保留，无新增权限或依赖。Codex++ 支持仍止于 1.2.4。

## 验证与限制

- 静态检查及 72 项自动测试通过；候选已在实际 Codex 中热加载并通过用户验收。
- 独立浏览器回归覆盖遮罩状态下的颜色保持、上下滚轮、收藏、搜索去重、动态菜单项、分组快捷键、新预览与额度提示，以及菜单关闭后的清理。
- 300 项命令的复现场景中，菜单静置后的重复 DOM 变更和滚动时的菜单行查询均降为 0；15 次无关聊天更新不再触发预览、斜杠菜单或额度提示扫描。这些是特定场景的工作量计数，不是通用帧率或 CPU 性能承诺。
- 插件依赖 Codex 的界面结构和部分原生内部接口；应用更新后仍可能需要兼容性适配。

---

## English

Fixes slash-menu scrolling stalls and keeps project and associated conversation colors stable while an image preview overlay is open. It also reduces unrelated scans during chat updates and releases resources when menus close.

### Fixed and improved

- Fixes [#4](https://github.com/JHees/better-ui-improvements-for-codex/issues/4): unchanged favorite icons are no longer rebuilt, breaking the mutation-observer refresh loop. Scrolling reuses section information instead of processing every command row.
- Removes redundant slash-menu polling and batches of hover-check timers. Closing or replacing a menu list releases its listeners, animations and cache.
- Markdown previews, slash menus, usage alerts and thread menus respond to relevant changes instead of unrelated chat updates. Embedded-page usage observers initialize on attachment or navigation rather than every host scan.
- Project and associated conversation colors no longer depend on visibility, interactivity or layout measurements. Overlays preserve colors, and unchanged colors avoid repeated style writes.
- Fixes missed colors for same-name projects and preserves other project menu hooks when changing one project's color. Continuous updates no longer postpone sidebar, thread-menu or upgrade-prompt processing indefinitely.
- Retains the background-deletion hotfix previously shipped in the 1.4.24 package. This release's tag, source and plugin package all include those fixes.

### Upgrade

Check for plugin updates in Codex Script Loader, or use automatic updates if enabled. Alternatively, download `better-ui-imropvement-1.4.25.zip`, verify the matching `.zip.sha256`, and install it through Loader without uninstalling first. Existing settings are preserved. No new permissions or dependencies are required. Codex++ support remains frozen at 1.2.4.

### Validation and limitations

- Syntax checks and all 72 automated tests pass. The candidate was hot-loaded into Codex and accepted by the maintainer after testing.
- Browser regression checks cover modal color retention, wheel scrolling, favorites, search deduplication, dynamic commands, section shortcuts, new previews and usage alerts, and menu cleanup.
- In the 300-command fixture, repeated idle DOM mutations and command-row queries during scrolling dropped to zero. Fifteen unrelated chat updates no longer triggered preview, slash-menu or usage-alert scans. These are workload counts for specific scenarios, not general FPS or CPU guarantees.
- The plugin relies on Codex UI structure and some native internal interfaces; future application updates may require compatibility changes.

**Full Changelog:** [v1.4.24...v1.4.25](https://github.com/JHees/better-ui-improvements-for-codex/compare/v1.4.24...v1.4.25)
