# Better UI Imropvement 1.4.23

本次更新修复 Codex 更新后的原生会话服务识别问题，以及已保存的新会话右键菜单缺少“重新生成标题”等操作的问题。

## 修复

- 原生服务发现不再依赖旧版错误文本的完整措辞，同时保留按主机解析客户端的识别条件。兼容原有入口与新版延迟连接入口，恢复模型列表读取及标题重新生成、Markdown 导出、永久删除共用的服务连接。
- 已保存的标题模型选择继续保留，不会因接口恢复而自动替换模型。
- 已保存的新会话仍保留侧栏临时 ID 时，从该行绑定的原生组件读取正式会话 ID，恢复标题生成、导出和删除选项。尚未保存或无法确认映射的会话仍不提供这些操作；正在回复时仍需等待会话完成后再生成标题。
- 包含 1.4.22 同版本修复包中的云项目会话着色修复：最近或置顶列表中可识别归属的独立云会话沿用项目配色，项目内条目仍共用项目颜色框。

## 升级与兼容性

通过 Codex Script Loader 更新，或安装 `better-ui-imropvement-1.4.23.zip`，使用配套 `.zip.sha256` 校验。无需修改 Loader，无新增权限或依赖；已有设置和项目颜色分配保留。Codex++ 支持仍止于 1.2.4。

候选已在 Windows Codex 26.1002.7124.0 中热加载：标题模型列表恢复为就绪，读取到 7 个可见模型，已保存的模型仍可用；11 个受支持会话菜单正常挂接，插件实例已替换，Loader 注入失败数为 0，没有重复插件节点。原生下拉组件、主题设置入口与 KaTeX 渲染入口可识别，额度显示正常。

正式发布内容通过静态检查、49 项测试和独立安装包校验。

后续候选热加载确认：当前选中的会话即使仍使用临时侧栏 ID，也已解析到正式 ID，原生菜单数据包含“重新生成标题”、导出和删除选项。

完整标题生成、文件导出和永久删除没有在本轮对实际会话执行端到端验收。相关功能依赖 Codex 内部接口，未来接口变化仍可能需要适配。

---

## English

This update restores native chat service discovery after a Codex update and fixes missing title-regeneration actions on newly persisted conversations.

### Fixed

- Service discovery no longer requires the exact wording of the previous connection error. It retains the host-client resolver check and recognizes both the original and deferred connection implementations. This restores model-list loading and the shared service connection used by title regeneration, Markdown export and permanent deletion.
- Saved title-model preferences remain unchanged when the connection recovers.
- Newly persisted conversations can retain a temporary sidebar ID. The plugin now reads the persisted conversation ID from the native component bound to that row, restoring title, export and delete actions. Unsaved or unresolved conversations remain excluded, and title generation still waits for an active conversation to finish.
- Includes the cloud conversation coloring fix previously shipped in the 1.4.22 hotfix package: standalone cloud conversations in recent or pinned lists inherit their identified project's palette, while project children continue to share the enclosing frame.

### Upgrading and compatibility

Update through Codex Script Loader or install `better-ui-imropvement-1.4.23.zip` and verify its matching `.zip.sha256`. No Loader changes, new permissions or dependencies are required. Existing settings and project color assignments are preserved. Codex++ support remains frozen at 1.2.4.

The candidate was hot-loaded in Codex 26.1002.7124.0 on Windows: model loading returned to ready with seven visible models and the saved choice available; all 11 supported conversation menus were attached, the plugin instance was replaced, and Loader reported zero injection failures with no duplicate plugin nodes. Native dropdown, appearance-setting and KaTeX entry points remain discoverable, and quota display works.

The release content passes syntax checks, 49 tests and standalone package validation.

A subsequent candidate hot-load confirmed that the selected conversation resolves to its persisted ID despite retaining a temporary sidebar key, and its native menu data includes title regeneration, export and delete actions.

Full title generation, file export and permanent deletion were not exercised end to end on real conversations in this validation. These features depend on internal Codex interfaces and may need adaptation after future updates.

**Full Changelog:** [v1.4.22...v1.4.23](https://github.com/JHees/better-ui-improvements-for-codex/compare/v1.4.22...v1.4.23)
