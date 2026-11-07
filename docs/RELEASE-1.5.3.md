# Better UI Imropvement 1.5.3

本版适配新版 Codex 的原生模块结构，修复主题设置写入和会话功能依赖发现。

## 修复

- 主题按钮通过当前原生设置服务写入外观偏好，保留旧接口回退和错误提示。
- 从当前模块缓存发现会话服务，恢复标题模型列表，并为会话读取及导出提供可用的原生客户端。
- 复用当前应用的 KaTeX，以及与活动编辑器相同的 CodeMirror 模块，减少对旧资源文件名的依赖。
- 删除入口优先使用当前原生确认函数；跳过无法读取源码的代理导出，保留原生允许条件。

## 升级与验证范围

通过 Loader 安装或更新独立的 `better-ui-imropvement-1.5.3.zip`；同名 `.sha256` 文件用于校验。不改变 Codex++ 最后支持版本 1.2.4 的边界。

静态检查和 99 项测试通过。候选已在真实主窗口验证主题双向切换、模型列表恢复、设置页和 KaTeX 公式输出。完整文件预览、导出保存对话框及删除确认流程未完成实机验收；没有为此次修复额外生成标题或删除聊天。

---

This release adapts native-module discovery to newer Codex builds and repairs appearance-setting writes and conversation-service discovery.

- Write theme preferences through the current native settings service, retaining the previous interface fallback and error reporting.
- Discover conversation services from the loaded module cache, restoring title-model discovery and the native client used for conversation reads and export.
- Reuse the bundled KaTeX module and the CodeMirror module belonging to the active editor instead of relying only on older asset filenames.
- Prefer the current native deletion-confirmation entry point, skip opaque function exports, and preserve native eligibility checks.

Update the independent `better-ui-imropvement-1.5.3.zip` package through Loader. A matching SHA-256 file is supplied. Codex++ support remains limited to version 1.2.4.

Static checks and 99 tests passed. Live candidate checks cover both theme directions, model-list recovery, settings and KaTeX output. Full file preview, export-save and deletion-confirmation acceptance remain incomplete; no additional title generation or chat deletion was performed.

[Full Changelog](https://github.com/JHees/better-ui-improvements-for-codex/compare/v1.5.2...v1.5.3)
