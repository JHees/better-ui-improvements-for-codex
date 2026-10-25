# Better UI Imropvement 1.4.26

## 新增

- 新增“隐藏原生额度按钮”开关（默认开启）。
- 隐藏 Codex 26.1021 侧栏底部的原生“用量”按钮，同时保留 Better UI 的侧栏额度控件。
- 关闭开关后立即移除隐藏样式，原生按钮恢复显示。

## 兼容性

- 仅面向 Codex Script Loader。
- 不修改 `app.asar` 或 WindowsApps。
- 原生按钮使用中英文 `aria-label` 识别；其他语言环境可能无法隐藏。
