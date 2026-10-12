# Better UI Imropvement 1.4.24

本次更新将会话永久删除改为使用 Codex 原生确认窗口，删除请求、进度和错误提示由原生功能处理。

## 改进

- 插件补充的“永久删除”入口等待右键菜单关闭后，再打开 Codex 原生确认窗口；移除插件自制弹窗及删除前的额外会话读取。
- 菜单已有原生删除项时直接保留，不再重复添加。原生确认窗口不可用时提示错误，不执行删除。
- 保留原生取消操作、默认安全焦点和删除失败后的重试行为。确认删除会同时删除子代理会话，且无法撤销。

## 升级与兼容性

通过 Codex Script Loader 更新，或安装 `better-ui-imropvement-1.4.24.zip`，并使用配套 `.zip.sha256` 校验。无需修改 Loader，无新增权限或依赖；已有设置保留。Codex++ 支持仍止于 1.2.4。

候选已在 Windows Codex 26.1007.2314.0 中热加载，验证了单一删除入口、原生确认窗口、默认焦点位于取消按钮以及取消后保留会话。Loader 注入失败数为 0，没有新增相关错误或重复插件节点。

正式发布内容通过静态检查、52 项测试和独立安装包校验。没有对实际会话执行永久删除端到端验证；此前故障的具体触发条件尚未重现。原生组件属于 Codex 内部接口，未来应用更新后仍可能需要适配。

---

## English

Permanent deletion now uses Codex's native confirmation dialog. Codex handles the deletion request, progress and error feedback.

### Improved

- The plugin's delete action waits for the context menu to close before opening the native confirmation dialog. The custom dialog and extra pre-deletion thread read have been removed.
- Existing native delete menu items are preserved without adding duplicates. If the native dialog is unavailable, the plugin reports an error without deleting anything.
- Native cancellation, safe default focus and retry behavior remain available. Confirmed deletion also deletes subagent tasks and cannot be undone.

### Upgrading and compatibility

Update through Codex Script Loader or install `better-ui-imropvement-1.4.24.zip` and verify its matching `.zip.sha256`. No Loader changes, new permissions or dependencies are required. Existing settings are preserved. Codex++ support remains frozen at 1.2.4.

The candidate was hot-loaded in Windows Codex 26.1007.2314.0. Validation confirmed a single delete entry, the native confirmation dialog, default focus on Cancel, and preservation of the conversation after cancellation. Loader reported zero injection failures, with no new related errors or duplicate plugin nodes.

The release content passes syntax checks, 52 tests and standalone package validation. Permanent deletion was not exercised end to end on a real conversation, and the original failure's precise trigger has not been reproduced. These native components are internal Codex interfaces and may require adaptation after future updates.

**Full Changelog:** [v1.4.23...v1.4.24](https://github.com/JHees/better-ui-improvements-for-codex/compare/v1.4.23...v1.4.24)
