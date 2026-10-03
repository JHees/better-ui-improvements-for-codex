# Better UI Imropvement 1.4.22

本次更新改善侧栏项目与会话的配色：云项目颜色框完整覆盖下属会话，独立会话采用淡色圆角背景，并提供可编辑的项目主题与原生下拉选择。

## 2026-10-03 同版本修复重发

- 修复最近 / 置顶等列表中单独显示的云项目会话未着色：识别云会话的原生项目 ID，沿用所属项目的配色；项目内条目继续共用项目颜色框，无归属会话保持默认样式。
- 安装 ZIP 与 SHA-256 文件已重新生成，版本仍为 **1.4.22**。已有 1.4.22 的安装不会因版本号相同而自动升级；请下载本页最新 ZIP 并通过 Loader 安装以替换旧包。已经热加载本次修复的候选无需重复安装。
- 本次安装包源码对应修复提交 [3cdb0f9](https://github.com/JHees/better-ui-improvements-for-codex/commit/3cdb0f994eaecbbac88978d8a2f45392bed62d0f)。`v1.4.22` 标签及 GitHub 自动生成的 Source code 归档仍对应首次发布源码；使用下方插件 ZIP 获取修复。
- 静态检查、**47 项测试**及独立包校验通过。Windows Codex 26.930.3930.0 热加载验证确认最近列表中两个云项目会话已继承项目蓝色，17 个无归属云会话未被误着色，项目内条目没有叠加独立着色；没有新增运行错误或重复样式。置顶归属使用同一识别逻辑并有回归覆盖，本次未实际调整置顶状态。

## 新增与改进

- 在 **界面增强 → 侧栏与会话着色** 中选择 Codex 默认、GitHub 或 VS Code 风格预设，独立编辑七个颜色槽位的浅色 / 深色配色，调整圆角、边框及普通 / 悬停 / 选中状态的着色强度。
- 新增主题 JSON 导入 / 导出。导入可先预览、应用或取消；无效配置不会覆盖已保存设置。主题只影响插件提供的项目和会话配色，不修改 Codex 的全局主题、字体或代码配色。
- 配色与标题模型选择复用 Codex 的原生下拉组件，保留原生弹层、勾选和键盘操作；设置容器卸载时清理对应控件。
- 独立会话去掉左侧色条，改为淡色圆角背景；悬停稍加深，选中时增加细边缘提示。已有配色及着色强度偏好保留，新预设采用更轻的默认底色。旧主题 JSON 的色条字段仍可导入，但不再绘制色条。
- 设置页预览分别展示项目整体颜色框与独立会话样式。

## 修复

- 云项目标题与会话列表采用兄弟节点布局时，项目颜色框现在覆盖整个项目容器，包含标题及下属会话。
- 展开的项目内条目共用项目颜色框，不再叠加独立会话着色；无项目归属的会话保持原生样式。
- 独立会话的选中样式同时识别当前 Codex 的原生选中标记。

## 升级与验证

通过 Codex Script Loader 更新，或安装 `better-ui-imropvement-1.4.22.zip`，使用配套 `.sha256` 校验。无需更改 Loader，无新增权限或依赖；已有设置和项目颜色分配保留。Codex++ 支持仍止于 1.2.4。

正式源码通过静态检查、46 项测试及独立包校验。候选在 Windows Codex 26.930.3930.0 中完成热加载，确认云项目框覆盖三个下属会话、项目内没有独立色条、独立会话采用圆角背景，运行实例替换后没有新增错误或重复样式；整体颜色框与会话外观已获用户验收。

原生下拉组件依赖当前 Codex 内部组件契约；未来 Codex 更新若改变这些契约，插件需要相应适配。

---

## English

This update improves sidebar colors: cloud project frames now enclose their child conversations, standalone conversations use soft rounded backgrounds, and project palettes can be edited with native dropdown controls.

### Same-version hotfix reissue — 2026-10-03

- Fix standalone cloud project conversations missing their project color in recent/pinned lists by reading their native project ID. Project children continue to share the enclosing frame, and unassigned conversations retain their default appearance.
- The plugin ZIP and SHA-256 have been rebuilt with version **1.4.22** unchanged. Existing 1.4.22 installations do not receive a version-based automatic update; download the current ZIP from this page and install it through Loader to replace the earlier package. Candidates already hot-loaded with this fix need no further installation.
- Package source corresponds to fix commit [3cdb0f9](https://github.com/JHees/better-ui-improvements-for-codex/commit/3cdb0f994eaecbbac88978d8a2f45392bed62d0f). The `v1.4.22` tag and GitHub's generated Source code archives still point to the initial release; use the plugin ZIP below for the fix.
- Syntax checks, **47 tests** and standalone package validation pass. Hot-loading in Codex 26.930.3930.0 on Windows confirmed two recent cloud conversations share the project's blue palette, 17 unassigned cloud conversations remain uncolored, and project children receive no additional conversation tint. No new runtime errors or duplicate styles were observed. Pinned membership uses the same resolution path with regression coverage; pin state was not changed during this validation.

### Added and improved

- Choose Codex, GitHub or VS Code inspired presets under **Interface enhancements → Sidebar and conversation colors**. Edit seven color slots separately for light and dark appearance, plus corner radius, border width and normal/hover/selected tint strength.
- Import and export theme JSON. Imported themes remain previews until applied and can be cancelled; invalid input leaves saved settings intact. These themes only affect plugin project and conversation styling, leaving Codex's global appearance, fonts and code colors unchanged.
- Palette and title-model selectors reuse Codex's native dropdown components, including popup, checked state and keyboard behavior. Their roots are cleaned up when the settings container is removed.
- Standalone conversations replace the leading stripe with soft rounded backgrounds, a stronger hover tint and a thin inset outline when selected. Existing palette and tint preferences are preserved; new presets use lighter defaults. Older theme JSON stripe fields remain accepted but no longer render a stripe.
- The settings preview distinguishes the enclosing project frame from standalone conversation styling.

### Fixed

- Cloud projects with sibling header and conversation-list nodes now receive one enclosing frame around the entire project, including all child conversations.
- Rows inside expanded projects share the project frame without additional conversation coloring. Unassigned conversations retain their native appearance.
- Selected conversation styling also recognizes Codex's current native selection attribute.

### Upgrading and validation

Update through Codex Script Loader or install `better-ui-imropvement-1.4.22.zip` and verify its matching `.sha256`. No Loader changes, new permissions or dependencies are required. Existing settings and project color assignments are preserved. Codex++ support remains frozen at 1.2.4.

The release source passes syntax checks, 46 tests and standalone package validation. The candidate was hot-loaded in Codex 26.930.3930.0 on Windows: the cloud project frame encloses its three conversations, project children have no independent stripes, and standalone conversations have rounded backgrounds. Instance replacement produced no new runtime errors or duplicate styles. The project frame and conversation appearance were accepted by the user.

Native dropdowns depend on Codex's internal component contracts and may require adaptation after future Codex updates.

**Full Changelog:** [v1.4.21...v1.4.22](https://github.com/JHees/better-ui-improvements-for-codex/compare/v1.4.21...v1.4.22)

**Hotfix diff / 同版本修复差异:** [v1.4.22...3cdb0f9](https://github.com/JHees/better-ui-improvements-for-codex/compare/v1.4.22...3cdb0f994eaecbbac88978d8a2f45392bed62d0f)
