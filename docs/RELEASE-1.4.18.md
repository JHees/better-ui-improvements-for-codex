# Better UI Imropvement 1.4.18

Markdown 文件预览中的 LaTeX 公式恢复显示，含公式的表格保持正确列布局。本版继续使用 Codex 自带的 KaTeX 排版组件。

## 修复

- **公式预览不显示**：文件预览隐藏标题、Codex 清空资源记录，或文档只有普通段落与公式时，仍能识别 Markdown 预览并初始化数学排版。
- **表格列错乱**：公式不再替换掉原生单元格容器；整格公式、文字与公式混排、多公式单元格均保留原有列结构。
- **编辑与清理**：保留点击编辑公式、提交后重新渲染；关闭功能或重载时移除预览装饰。单纯预览不会改写 Markdown 源文档。

## 升级提示

- 已安装用户可通过 Codex Script Loader 的插件更新功能升级，或安装下方 `better-ui-imropvement-1.4.18.zip`。无需迁移设置，权限不变。
- 数学预览增强作用于 Markdown 文件预览。Codex 聊天消息已有原生公式支持；本版不接管聊天消息的公式渲染。
- ZIP 旁提供同名 `.sha256` 校验文件。当前版本面向 Codex Script Loader；Codex++ 的最后受支持版本仍为 1.2.4。

## 验证

静态检查和 28 项测试通过。浏览器回归覆盖行内与多行公式、公式表格、点击编辑及卸载恢复；已验收候选通过原位热加载检查。

---

## English

This patch restores LaTeX in Markdown file previews and preserves table columns when cells contain formulas. It reuses the KaTeX renderer bundled with Codex.

### Fixed

- Initialize formula previews when file headers are hidden, resource timing entries have been cleared, or a document contains only prose and math.
- Keep native table-cell wrappers intact for formula-only cells, mixed text and math, and multiple formulas in one cell.
- Preserve click-to-edit and re-rendering, clean up decorations on disable/reload, and leave Markdown source unchanged during preview.

### Upgrading

Update through Codex Script Loader or install `better-ui-imropvement-1.4.18.zip` with its matching `.sha256` file. Settings and permissions are unchanged. This enhancement applies to Markdown file previews; chat messages retain native Codex math rendering. Codex++ support remains frozen at 1.2.4.

Validation includes static checks, 28 tests, browser regression checks for math, tables, editing and cleanup, and an accepted candidate verified through an in-place reload.

**Full Changelog:** [v1.4.17...v1.4.18](https://github.com/JHees/better-ui-improvements-for-codex/compare/v1.4.17...v1.4.18)
