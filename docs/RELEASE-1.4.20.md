# Better UI Imropvement 1.4.20

修复重启后直接打开只有行内或表格公式的 Markdown 文档时，公式仍显示为原始 LaTeX 文本的问题。

## 兼容性

**支持并实际验证的 Codex 版本：26.924.2738.0（Windows）。** 其他版本未在本轮重新验证。此前打开过块级公式会让原生应用提前加载 KaTeX，从而掩盖此问题；不将该缺口归因于某次更新首次引入。

## 修复

- 原生 KaTeX 尚未加载时，从当前 Markdown 编辑器模块的动态导入关系发现它，恢复行内及表格公式渲染。
- 继续复用 Codex 自带 KaTeX，不固定资源文件哈希，不新增外部依赖；保留已加载模块和旧版主模块的发现路径。

## 升级与验证

通过 Codex Script Loader 的插件更新功能升级，或安装 `better-ui-imropvement-1.4.20.zip` 及配套 `.sha256` 校验文件。设置、权限和插件身份不变。Codex++ 支持仍止于 1.2.4。

静态检查、35 项测试及独立包校验通过。新增回归测试覆盖没有预加载 KaTeX、没有块级公式的场景。已验收候选通过热加载，实际验证了正文行内公式、表格公式、相对图片和货币文本；设置页、额度悬停与菜单入口回归正常。本轮未对真实会话执行标题生成、删除或导出。

---

## English

This patch fixes Markdown previews that show raw LaTeX when an inline-only or table-formula document is opened before Codex has loaded its math renderer.

### Compatibility

**Supported and verified Codex version: 26.924.2738.0 on Windows.** Other versions were not revalidated in this round. Opening a block formula first could preload KaTeX and mask this issue; the fix does not assume that a particular app update first introduced it.

### Fixed

- Discover lazy-loaded KaTeX through the current native Markdown editor's dynamic import when the module has not loaded yet.
- Reuse Codex's bundled KaTeX without pinned asset hashes or new dependencies, while retaining discovery through loaded assets and older main modules.

### Upgrading and validation

Update through Codex Script Loader or install `better-ui-imropvement-1.4.20.zip` with its matching `.sha256`. Settings, permissions, and identity are unchanged. Codex++ support remains frozen at 1.2.4.

Syntax checks, 35 tests, and standalone package validation pass. The added regression covers a preview with neither preloaded KaTeX nor a block formula. The accepted candidate was hot-loaded and checked for inline/table formulas, relative images, currency text, settings pages, usage hover behavior, and menu entries. Live thread title generation, deletion, and export were not exercised.

**Full Changelog:** [v1.4.19...v1.4.20](https://github.com/JHees/better-ui-improvements-for-codex/compare/v1.4.19...v1.4.20)
