# Better UI Imropvement 1.4.24

2026-10-12 同版本修复重发：确认永久删除后立即关闭原生弹窗，在后台显示删除进度，让 Codex 在等待期间保持可操作。

## 修复与改进

- 使用 Codex 原生确认窗口和 `thread/delete` 接口，保留原生警告、取消操作和默认安全焦点。
- 确认后关闭弹窗，再在后台等待删除完成；收到成功响应后才提示成功，失败时显示错误。
- 阻止重复确认发送第二次删除请求。已有原生删除菜单项使用相同流程，不重复添加入口。
- 原生确认窗口不可用时提示错误，不执行删除。确认删除包含子代理会话，且无法撤销。

## 安装与源码

下载本页的 `better-ui-imropvement-1.4.24.zip`，使用配套 `.zip.sha256` 校验，并通过 Codex Script Loader 安装。已安装早期 1.4.24 的用户应重新安装这个同版本 ZIP；按版本号比较的自动更新可能不会提示。无需卸载，无新增权限或依赖，已有设置保留。Codex++ 支持仍止于 1.2.4。

修复源码：[fcd0f39](https://github.com/JHees/better-ui-improvements-for-codex/commit/fcd0f3907da3713dcdad1b5931c99b5698c614a5)。`v1.4.24` 标签及 GitHub 自动生成的 Source code 归档仍对应首次发布源码；本页插件 ZIP 已包含此次修复。重建修复包时应使用上述修复提交。

## 验证与限制

- 发布源码通过静态检查、54 项测试及独立安装包校验；回归覆盖慢请求、错误返回、重复确认和取消路径。
- Windows Codex 26.1007.2314.0 中完成实际删除测试：确认后约 92 毫秒弹窗已关闭，此时请求仍在进行且进度可见；该次请求约 0.88 秒后完成，会话从侧栏移除。
- 诊断期间创建的六个专用测试会话均已清理，复核主记录、历史记录和会话文件均不存在。热加载后无新增相关错误或重复插件节点。
- 本次修复解除删除等待期间的界面锁定。原生服务端的慢删除根因尚未定位，不承诺缩短后台清理时间；原生内部接口在应用更新后仍可能需要适配。

---

## English

Same-version hotfix reissue on 2026-10-12: the native confirmation dialog closes immediately after confirmation, while deletion continues with a progress notification so Codex remains usable.

### Fixed and improved

- Reuses Codex's native confirmation dialog and `thread/delete` API, preserving the warning, cancellation and safe default focus.
- Closes the dialog after confirmation and waits for deletion in the background. Success is reported only after a successful response; failures show an error.
- Prevents duplicate confirmation from sending a second deletion request. Existing native delete menu items use the same flow without adding duplicates.
- If the native dialog is unavailable, the plugin reports an error without deleting anything. Confirmed deletion includes subagent tasks and cannot be undone.

### Installation and source

Download `better-ui-imropvement-1.4.24.zip` from this release, verify its matching `.zip.sha256`, and install it through Codex Script Loader. Users with the earlier 1.4.24 package should reinstall this same-version ZIP; version-based automatic updates may not offer it. No uninstall, new permissions or dependencies are required, and existing settings are preserved. Codex++ support remains frozen at 1.2.4.

Hotfix source: [fcd0f39](https://github.com/JHees/better-ui-improvements-for-codex/commit/fcd0f3907da3713dcdad1b5931c99b5698c614a5). The `v1.4.24` tag and GitHub-generated Source code archives still point to the initial release. The plugin ZIP on this page contains the hotfix. Use the linked hotfix commit when rebuilding it.

### Validation and limitations

- The release source passes syntax checks, 54 tests and standalone package validation. Regression coverage includes pending requests, failures, duplicate confirmation and cancellation.
- Real deletion was exercised in Windows Codex 26.1007.2314.0: the dialog was closed after about 92 ms while the request was still pending and progress remained visible. That request completed after about 0.88 seconds, removing the conversation from the sidebar.
- All six disposable diagnostic conversations were removed. Follow-up checks found no remaining main records, history records or conversation files. Hot-loading produced no new related errors or duplicate plugin nodes.
- This fixes the interface lock during deletion. The cause of slow deletion inside the native server remains unresolved; this release does not promise faster backend cleanup. Internal Codex interfaces may require adaptation after application updates.

**Full Changelog:** [v1.4.23...fcd0f39](https://github.com/JHees/better-ui-improvements-for-codex/compare/v1.4.23...fcd0f3907da3713dcdad1b5931c99b5698c614a5)
