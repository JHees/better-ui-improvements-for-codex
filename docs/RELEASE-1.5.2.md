# Better UI Imropvement 1.5.2

本版恢复采用 Rspack 打包的新版 Codex 中的侧栏额度显示，并加强请求客户端识别，减少更新后因模块改名或压缩方式变化而失效的情况。

## 修复与改进

- 从页面实际加载的本地脚本、模块预加载链接及脚本资源记录发现入口，不要求新版入口使用固定文件名或数字编号。
- 按模块缓存结构和真实请求方法识别客户端，不依赖固定运行时导出名或 `async safeGet` 源码写法；只检查已初始化模块，不执行无关模块工厂。
- 排除会伪造方法的 RPC 代理，隔离读取失败的导出，并去除重复客户端。
- 客户端失效后不在同一轮重复调用；所有候选失败时清除发现缓存，让后续刷新重新发现。
- 保留旧版 ESM 入口发现方式，覆盖资源记录被清空的场景。
- 更新中英文安装说明，加入图示导览和贡献指南。

## 升级与验证

通过 Loader 的插件更新功能或安装本版 ZIP 升级，现有设置保留，无需升级 Loader。仅支持 Codex Script Loader；Codex++ 支持仍止于 1.2.4。

静态检查、94 项测试及独立打包通过。测试覆盖旧版入口、新版入口与导出改名、模块工厂压缩变化、原型方法、RPC 代理、异常导出和失效缓存恢复。候选已热加载并通过用户验收：额度显示正常、实例替换成功，无重复额度控件或 Loader 运行错误。

查询仍使用 Codex 内部请求客户端，不能保证未来接口移除或认证机制改变时无需适配。本版不引入独立后台服务。

资产：`better-ui-imropvement-1.5.2.zip` 及同名 `.sha256` 校验文件。

---

This release restores sidebar quota display in newer Rspack-based Codex builds and makes HTTP client discovery less sensitive to module renaming and minification changes.

## Fixes and improvements

- Discovers local entry modules from page scripts, modulepreload links and script resource records without requiring a fixed entry filename or numeric chunk ID.
- Identifies clients through module cache structure and real request methods rather than fixed runtime export names or an `async safeGet` source pattern. Only initialized modules are inspected; unrelated module factories are not executed.
- Rejects RPC proxies that fabricate methods, isolates unreadable exports and deduplicates clients.
- Avoids calling a failed cached client twice in one attempt. When all candidates fail, clears the discovery cache so the next refresh can discover a replacement.
- Retains legacy ESM discovery, including cleared resource timing records.
- Updates bilingual installation documentation with visual guides and contribution instructions.

## Upgrade and validation

Update through Loader's plugin updates or install the ZIP. Existing settings are preserved; no Loader upgrade is required. Codex Script Loader remains the supported runtime; Codex++ support ended at 1.2.4.

Static checks, 94 tests and package creation passed. Tests cover legacy entries, renamed entries and exports, changed module factory source, prototype methods, RPC proxies, failing exports and stale client cache recovery. The candidate was hot-loaded and accepted by the user, with working quota display, successful instance replacement, no duplicate quota controls and no Loader runtime errors.

Quota retrieval still depends on Codex's internal HTTP client. Future API removal or authentication changes may require adaptation. No standalone background service is introduced.

Assets: `better-ui-imropvement-1.5.2.zip` and its `.sha256` file.

[Full Changelog](https://github.com/JHees/better-ui-improvements-for-codex/compare/v1.5.1...v1.5.2)
