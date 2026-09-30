# Better UI Imropvement 1.4.21

在侧栏直接切换 Codex 明暗外观，并让额度控件等待目标位置就绪后再显示。

## 新增与改进

- 新增明暗主题切换按钮，独立于额度显示开关；即使关闭额度，仍可切换并保存 Codex 的浅色或深色外观。
- 两个按钮共用紧凑尺寸、圆角、背景和悬停反馈。主题按钮平时显示太阳或月亮，悬停时显示“切换”及目标外观。
- 在 **设置 → Script-Loader → 界面增强 → 额度** 中单独开启或关闭主题按钮。
- 包含上一版本之后已提交的项目底色调整：背景更柔和，文字与悬停配色跟随 Codex 当前明暗外观。

## 修复

- 新导航栏尚未就绪或暂时隐藏时，不再先把额度挂载到旧版兜底位置；仍保留旧版底栏锚点兼容。
- 主题按钮不再用内联透明背景覆盖悬停背景；关闭任一按钮不会移除另一个按钮。

## 升级与验证

通过 Codex Script Loader 更新，或安装 `better-ui-imropvement-1.4.21.zip`，配套 `.sha256` 可用于校验。现有设置保留，无新增权限或依赖。Codex++ 支持仍止于 1.2.4。

正式发布源码通过静态检查、39 项测试及独立包校验。已在 Windows Codex 26.928.2636.0 热加载候选，验证关闭额度后主题按钮保留、重新开启无重复节点，以及悬停目标文字。启动过渡由自动回归覆盖；本轮没有退出 Codex 执行完整冷启动验收，也没有为验证而切换用户当前明暗偏好。

---

## English

Switch Codex between light and dark directly from the sidebar, and show usage only when its final layout anchor is ready.

### Added and improved

- An independent app theme button saves Codex's native light/dark preference and remains available when usage display is disabled.
- Both controls share compact sizing, rounded corners, background and hover feedback. The theme button shows a sun or moon normally and the target appearance on hover.
- Enable or disable it under **Settings → Script-Loader → Interface enhancements → Usage**.
- Includes the project background adjustment committed since the previous release: softer backgrounds with text and hover colors following Codex's effective appearance.

### Fixed

- An unfinished or hidden navigation rail no longer triggers temporary legacy usage placement. Legacy bottom-control anchors remain supported.
- Inline transparent styling no longer suppresses the theme button's hover background. Disabling either control leaves the other intact.

### Upgrading and validation

Update through Codex Script Loader or install `better-ui-imropvement-1.4.21.zip` with its matching `.sha256`. Existing preferences are preserved; no new permissions or dependencies are required. Codex++ support remains frozen at 1.2.4.

The release source passes syntax checks, 39 tests and standalone package validation. The candidate was hot-loaded in Codex 26.928.2636.0 on Windows to check independent toggles, duplicate-free remounting and hover labels. Startup transitions are covered by regression tests; a full app cold start and live changes to the user's current appearance preference were not performed in this round.

**Full Changelog:** [v1.4.20...v1.4.21](https://github.com/JHees/better-ui-improvements-for-codex/compare/v1.4.20...v1.4.21)
