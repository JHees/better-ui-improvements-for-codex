<div align="center">

# Bennett UI Improvements for Codex++

**A focused UI and workflow upgrade for BigPizzaV3 Codex++.**

[![Version](https://img.shields.io/badge/version-1.4.5-14b8a6)](https://github.com/JHees/bennett-ui-improvements-for-codexplusplus)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Runtime](https://img.shields.io/badge/runtime-Codex%2B%2B-111827)](https://github.com/BigPizzaV3/CodexPlusPlus)
[![Mode](https://img.shields.io/badge/mode-renderer--only-7c3aed)](#compatibility)

**English** · [简体中文](README.zh-CN.md)

</div>

Bennett UI Improvements 1.4.5 is a renderer-only plugin for Codex Script Loader, with a legacy Codex++ compatibility path. It brings project-aware sidebar styling, reliable quota display, focused formula and local-image preview support, native thread export and permanent deletion, and a dedicated settings page into one installable script.

This project adapts [b-nnett/codex-plusplus-bennett-ui](https://github.com/b-nnett/codex-plusplus-bennett-ui) to the BigPizzaV3 user-script runtime while preserving the original authorship and MIT license notices. The migration is maintained by [JHees](https://github.com/JHees).

## Highlights

| Area | What it adds |
| --- | --- |
| Sidebar | Project and conversation colors, project-color controls, and slash-menu polish. |
| Usage | Real 5-hour and weekly quota data, optional Credit view, reset-time tooltips, and explicit `API` mode. |
| History | Leaves ordinary and project conversations to Codex's native, independently scoped pagination. |
| Markdown | Adds KaTeX formulas and local/relative images to `.md` previews while leaving tables, links, and layout to Codex. |
| Thread actions | Adds Markdown export and confirmed permanent deletion to Codex's built-in thread menu while leaving native project movement in place. |
| Settings | A dedicated Bennett UI panel with per-feature switches. |
| Noise reduction | Hides Codex quota-exhaustion and Plus/Pro upgrade prompts while keeping the composer and app-update notices visible. |

## Install

### Codex++ Script Market

1. Open **Codex++ Management Tools**.
2. Find and install **Bennett UI Improvements**.
3. Enable the script and select **Reload user scripts**.

### Manual installation

Copy [`scripts/bennett-ui-improvements.js`](scripts/bennett-ui-improvements.js) to:

```text
%APPDATA%\Codex++\user_scripts\
```

Enable the script in Codex++ and reload user scripts. A full Codex restart is normally unnecessary.

## Features

| Feature | Default | Support |
| --- | ---: | --- |
| Project backgrounds and colors | On | Stable |
| Conversation project colors | On | Stable for assigned project conversations; ordinary chats keep the default style |
| 5-hour / Weekly / Credit usage | On | Stable when the current page exposes usage data |
| Hide quota-exhaustion prompts | On | Stable |
| Hide Plus/Pro upgrade prompts | On | Stable; Codex app-update notices remain visible |
| Formula and local-image preview | On | Stable for `.md` and `.markdown` previews; native tables are untouched |
| Slash-menu polish | On | Stable |
| Thread Markdown export | On | Local non-ephemeral threads; uses the native Codex App Server |
| Thread permanent deletion | On | Local non-ephemeral threads; irreversible and explicitly confirmed |

Feature switches are available under **Codex++ Management Tools → Bennett UI Settings**. Preferences are stored locally and survive script reloads. Version 1.4.5 keeps the former settings-search and settings-sidebar-width tweaks removed because current Codex builds provide both natively, and returns Markdown tables, links, and layout to Codex's native preview. Project-color choices continue to migrate between the legacy Codex++ and Script Loader storage namespaces.

Change a project color from the **Project color** submenu in the project's built-in context menu. Every option includes both a label and a color swatch: **Auto** keeps name-based color assignment, while **No color** restores Codex's native styling for the project and its conversations. Explicit choices are bound to the stable project ID when Codex exposes one, with the project name retained as a compatibility fallback. The plugin appends only this submenu to Codex's project-menu data; it does not replace or cover the native context menu.

Conversation colors require Codex's stable project ID. A working-directory name shown in an ordinary chat is not treated as project membership.

## Native thread context actions

- **Move to project** and **Remove from project** remain Codex-native operations. Bennett does not duplicate or replace them.
- **Export Markdown** appears beside Codex's sharing and copy actions. It exports chronological user and assistant text plus local-image path markers, while excluding system/developer context, reasoning, and tool payloads.
- **Delete permanently** appears at the bottom as a danger action. It requires an explicit confirmation and uses Codex's native `thread/delete`; there is no Bennett or Codex++ backup/undo path.
- Both additions have independent switches. When either is active, obsolete Codex++ inline More/Delete buttons are hidden without affecting Codex's Pin or Archive controls.
- These actions call the local Codex App Server directly and do not require the Codex++ session-delete bridge or helper service.

## Conversation project colors

- Conversation rows inherit the color of their project in the normal sidebar, expanded project lists, and limited-filter results.
- The display uses a subtle background and a colored leading edge so titles, selected rows, and unread indicators remain easy to read.
- Conversations without a known project keep Codex's default appearance.
- Turn the feature on or off from **Codex++ Management Tools → Bennett UI Settings**. Project color choices continue to apply automatically.
- Changing a project color updates currently visible conversation rows immediately.

## Native conversation pagination

Current Codex builds own conversation discovery, grouping, and pagination. Bennett no longer calls private history-refresh modules or exposes a separate history limit.

- **Recents** uses Codex's projectless infinite-scroll scope.
- Every project uses its own project-scoped catalog and loads older conversations independently when the project is expanded.
- Pinned conversations remain in Codex's separate pinned container.
- When CC Switch unified session history is enabled, CC Switch/Codex still own the merge. Bennett neither reads session files nor creates a second conversation database.

## Usage-data behavior

- Saved quota snapshots are not presented as fresh data after startup.
- The widget accepts only current main-account data from `/wham/usage`; persisted snapshots, renderer events, and page text are not used as quota sources.
- Five-hour and weekly views show remaining percentage and reset-time tooltips.
- The quota control reads only the main account `rate_limit`; `additional_rate_limits` such as GPT-5.3 Codex-specific limits are excluded.
- Credit appears only when actual credit data is available.
- API or pure-API providers show `API`; Bennett does not fabricate ChatGPT quota values.
- The standalone `market-hide-usage-alert.js` script is no longer needed because that behavior is built in.

## Quota-prompt filtering

- Hides Codex quota-exhaustion notices and upgrade prompts while keeping conversation content, the composer, and app-update notices visible.
- Works in both the main Codex interface and embedded ChatGPT views.
- Enable or disable it from **Codex++ Management Tools → Bennett UI Settings**.

## Markdown preview

The right-side Markdown preview enhancement is deliberately limited to:

- Inline and display math: `$...$`, `$$...$$`, `\(...\)`, and `\[...\]`.
- Codex's bundled KaTeX renderer—no external math CDN is required.
- Local and relative image paths resolved from the current document.
- Selecting rendered math to inspect its LaTeX source.

Markdown tables, links, wrapping, and column sizing remain Codex-native. Currency values such as `$25` are not treated as formula delimiters.

![Markdown preview with rendered inline and display math](docs/images/markdown-preview-math.png)

## Compatibility

Bennett UI runs as a Codex++ user script and does not modify the official Codex installation. Features that depend on Codex's interface may need updates after major Codex releases. If something looks wrong, reload the user scripts first.

## Optional companion script

[`scripts/hidden-user-message-visibility-fix.js`](scripts/hidden-user-message-visibility-fix.js) is an independent compatibility fix for user messages hidden by conversation compaction or steering-rendering issues. It is not part of the Bennett UI core script.

## Credits and license

- Original project: [b-nnett/codex-plusplus-bennett-ui](https://github.com/b-nnett/codex-plusplus-bennett-ui)
- Target runtime: [BigPizzaV3/CodexPlusPlus](https://github.com/BigPizzaV3/CodexPlusPlus)
- Script Market: [BigPizzaV3/CodexPlusPlusScriptMarket](https://github.com/BigPizzaV3/CodexPlusPlusScriptMarket)
- Migration repository: [JHees/bennett-ui-improvements-for-codexplusplus](https://github.com/JHees/bennett-ui-improvements-for-codexplusplus)

Released under the [MIT License](LICENSE). Original copyright, attribution, and permission notices are preserved in the distributed script and [`NOTICE.md`](NOTICE.md).
