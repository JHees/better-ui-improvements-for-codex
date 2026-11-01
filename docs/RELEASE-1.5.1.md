# Better UI Imropvement 1.5.1

本版修复新版 Codex 中侧栏额度一直显示“—”、无法获取数据的问题。

## 修复

- 额度客户端发现会追踪页面入口中的 `app-main` 引用，找到间接加载的请求模块，不依赖固定的文件哈希或完整的资源记录。
- 使用原生 XMLHttpRequest 读取本地入口资源，避免 Codex 的 fetch 包装拒绝 `app:` 地址；同时识别 `app-primary` 模块。
- 增加资源记录被清空、客户端经中间入口加载时的回归测试。

## 升级与验证

通过 Loader 自动更新或安装本版 ZIP，现有设置继续保留，无需升级 Loader。仅支持 Codex Script Loader；Codex++ 支持仍止于 1.2.4。

静态检查、91 项测试和独立打包通过。候选已热加载，额度数据显示恢复，插件实例替换正常，无重复额度控件或 Loader 运行错误，并已通过用户验收。

额度查询仍使用 Codex 内部请求客户端；未来内部接口变化可能需要再次适配。本版没有引入独立后台服务。

资产：`better-ui-imropvement-1.5.1.zip` 及同名 `.sha256` 校验文件。

---

This release fixes sidebar quota remaining at “—” in newer Codex builds.

## Fixes

- Follows the page entry's `app-main` dependency to discover indirectly loaded HTTP client modules without fixed bundle hashes or complete resource timing records.
- Reads local entry resources with native XMLHttpRequest, avoiding Codex's fetch wrapper rejecting `app:` URLs, and recognizes `app-primary` modules.
- Adds a regression test for cleared resource timing records and an intermediate application entry.

## Upgrade and validation

Update through Loader or install the ZIP. Existing settings are preserved; no Loader upgrade is required. Codex Script Loader remains the supported runtime; Codex++ support ended at 1.2.4.

Static checks, 91 tests and package creation passed. The candidate was hot-loaded, quota display recovered, the plugin instance was replaced without duplicate quota controls or Loader runtime errors, and user acceptance passed.

Quota retrieval still uses Codex's internal HTTP client and may need adaptation after future internal API changes. This release does not add a standalone background service.

Assets: `better-ui-imropvement-1.5.1.zip` and its `.sha256` file.

[Full Changelog](https://github.com/JHees/better-ui-improvements-for-codex/compare/v1.5.0...v1.5.1)
