# Better UI Imropvement 1.5.4

本版修复 Markdown 文件预览中含公式表格的列错位，并兼容当前 Codex 的原生公式渲染。

## 修复

- 让公式与同一单元格中的文字保持在一起，修复纯公式单元格、多个公式及公式与文字混排时的列错位。
- 消除嵌套单元格的重复布局，同时去重视口中重复的单元格标记。
- 跳过原生已处理的公式范围；原生未处理的公式继续使用插件渲染。

## 升级与验证范围

通过 Codex Script Loader 更新，或安装独立的 `better-ui-imropvement-1.5.4.zip`。同名 `.sha256` 文件用于校验，无需修改 Markdown 原文。Codex++ 支持仍止于 1.2.4。

静态检查及 101 项测试通过。候选在 Windows Codex 26.1106.6628.0 的真实预览组件中通过宽、窄布局、公式编辑、重排及卸载清理检查；热加载后，当前文档已渲染的 22 行表格没有公式脱离单元格，两个窗口的插件均正常运行。其他 Codex 版本未做实机验证。

---

This release fixes misaligned formula tables in Markdown file previews and works alongside the current Codex native math renderer.

## Fixes

- Keep formulas and text inside their original table cells, including cells containing only a formula, multiple formulas, or mixed text and math.
- Remove duplicate layout from nested cells and deduplicate repeated cell marks in the viewport.
- Leave formula ranges already handled by Codex to its native renderer, while retaining the plugin fallback for other formulas.

## Upgrade and validation

Update through Codex Script Loader or install the independent `better-ui-imropvement-1.5.4.zip`. A matching `.sha256` file is supplied. No Markdown source changes are required. Codex++ support remains limited to version 1.2.4.

Static checks and 101 tests passed. Live candidate checks on Windows Codex 26.1106.6628.0 covered wide and narrow layouts, formula edits, reflow, and extension cleanup. After hot reload, none of the 22 rendered table rows in the open document had formulas outside their cells, and the plugin was running in both windows. Other Codex versions have not been tested live.

[Full Changelog](https://github.com/JHees/better-ui-improvements-for-codex/compare/v1.5.3...v1.5.4)
