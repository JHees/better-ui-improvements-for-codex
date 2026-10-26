<div align="center">

# Better UI Imropvement for Codex

**Interface and workflow improvements for Codex Script Loader.**

[![Version](https://img.shields.io/badge/version-1.5.0-14b8a6)](https://github.com/JHees/better-ui-improvements-for-codex)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Runtime](https://img.shields.io/badge/runtime-Codex%20Script%20Loader-111827)](https://github.com/JHees/codex-script-loader)
[![Mode](https://img.shields.io/badge/mode-renderer--only-7c3aed)](#compatibility)

**English** · [简体中文](README.zh-CN.md)

</div>

Better UI Imropvement 1.5.0 is a renderer-only plugin for [Codex Script Loader](https://github.com/JHees/codex-script-loader). It brings project-aware sidebar styling, reliable quota display, focused formula and local-image preview support, compacted-context title regeneration, native thread export and permanent deletion, and a dedicated settings page into one installable script.

Version 1.5.0 restores newer Codex menu compatibility, improves slash-menu interaction and sidebar control continuity, remembers quota selection, and refreshes settings with concise explanations. See the [release notes](docs/RELEASE-1.5.0.md).

> [!IMPORTANT]
> **Codex++ support ended with version `1.2.4`.** That is the final version published in the BigPizzaV3 Codex++ Script Market. Versions after `1.2.4`, including the current `1.5.0`, target Codex Script Loader. No new releases, compatibility fixes, or testing are provided for Codex++.

## Highlights

| Area | What it adds |
| --- | --- |
| Sidebar | Project and conversation colors, project-color controls, and slash-menu polish. |
| Usage | Real 5-hour and weekly quota data, optional Credit view, reset-time tooltips, and explicit `API` mode. |
| History | Leaves ordinary and project conversations to Codex's native, independently scoped pagination. |
| Markdown | Adds KaTeX formulas and local/relative images to `.md` previews while leaving tables, links, and layout to Codex. |
| Thread actions | Adds compacted-context title regeneration, Markdown export, and confirmed permanent deletion to Codex's built-in thread menu while leaving native project movement in place. |
| Settings | A dedicated Better UI Imropvement panel with per-feature switches. |
| Noise reduction | Hides Codex quota-exhaustion and Plus/Pro upgrade prompts while keeping the composer and app-update notices visible. |

## Install

### Codex Script Loader

This plugin is released independently from [Codex Script Loader](https://github.com/JHees/codex-script-loader). It is not bundled with, mirrored into, versioned by, or deployed from the Loader repository.

Run `npm test` and `npm run check`, then create an installable ZIP with:

```powershell
npm run package
```

Install the resulting `dist/better-ui-imropvement-<version>.zip` from the Loader settings page. For development, the repository root is also a valid package folder because [`manifest.json`](manifest.json) points to the canonical [`scripts/better-ui-imropvement.js`](scripts/better-ui-imropvement.js). All source, manifest, tests, versions, and releases are owned by this repository.

The package command also creates `dist/better-ui-imropvement-<version>.zip.sha256`. Tagged stable releases publish both files. Packages using the previous identity must be removed before installing this independently identified plugin. Automatic replacement remains an opt-in setting; checking for updates does not enable it.

### Legacy Codex++ installations

Codex++ users may continue using the market's frozen `1.2.4` build, but it is unsupported and will not receive updates from this repository. Do not install a newer repository build into Codex++ and do not submit newer releases to its Script Market.

## Features

| Feature | Default | Support |
| --- | ---: | --- |
| Project backgrounds and colors | On | Stable |
| Conversation project colors | On | Stable for assigned project conversations; ordinary chats keep the default style |
| 5-hour / Weekly / Credit usage | On | Stable when the current page exposes usage data |
| App theme toggle | On | Independent sidebar button switches and saves Codex's light/dark appearance; shows the target mode on hover |
| Hide quota-exhaustion prompts | On | Stable |
| Hide Plus/Pro upgrade prompts | On | Stable; Codex app-update notices remain visible |
| Formula and local-image preview | On | Stable for `.md` and `.markdown` previews; native tables are untouched |
| Slash-menu polish | On | Stable |
| Thread title regeneration | On | Local non-ephemeral threads; compacts a temporary fork before using the selected model (default: GPT-5.4-Mini) |
| Thread Markdown export | On | Local non-ephemeral threads; uses the native Codex App Server |
| Thread permanent deletion | On | Local non-ephemeral threads; irreversible and explicitly confirmed |

Feature switches are available under **Codex Settings → Script-Loader → Interface enhancements**. Preferences are stored locally and survive script reloads. Version 1.4.11 restores quota retrieval through Codex's renderer HTTP service and suppresses the redundant leading chat icon on pinned sidebar rows. The plugin-defined settings page continues to use the current Codex settings layout, typography, cards, controls, and scroll surface. Title regeneration keeps its system-scoped temporary working fork, waits for a newly completed native compaction turn, and suppresses only the matching temporary-thread notification. Markdown tables, links, and layout remain delegated to Codex's native preview, and project-color choices continue to migrate from the legacy Codex++ storage namespace to the Script Loader namespace.

### Project palette and themes

Under **Interface enhancements → Sidebar and conversation colors**, choose a Codex default, GitHub, or VS Code inspired preset. Presets only style Better UI's project backgrounds, titles/icons and conversation coloring; they do not change Codex's theme, global background, fonts or code palette. Follow Codex's light/dark mode or select a fixed mode.

- Edit all seven color slots in both light and dark variants: accent, project text/icon, background, and border, using a color picker or `#RRGGBB`. Existing per-project slot assignments remain intact.
- Customize corner radius, border width, project hover intensity, and normal/hover/selected conversation tint strength. The preview canvas color only affects the preview.
- Palette settings are grouped below the sidebar coloring switches. Palette and title-model dropdowns mount Codex’s existing Dropdown / RadioGroup / RadioItem components, which provide the popup, checked state, keyboard navigation and theme styling. Color/number inputs and the import dialog remain native browser controls. Presets and modes save immediately; color/text edits save on leaving the field. Switch between light/dark palettes, expand **Advanced** for geometry, or **Preview** for an example. Import opens a dialog and remains a draft until **Apply theme**; it can also be cancelled.
- Import a Better UI theme JSON file or paste JSON (schemaVersion 1, at most 64 KB). Export includes both variants and all styles for backup/sharing. VS Code extension and Codex theme files are not directly supported. Invalid imports leave saved settings intact.

Change a project color from the **Project color** submenu in the project's built-in context menu. Every option includes both a label and a color swatch: **Auto** keeps name-based color assignment, while **No color** restores Codex's native styling for the project and its conversations. Explicit choices are bound to the stable project ID when Codex exposes one, with the project name retained as a compatibility fallback. The plugin appends only this submenu to Codex's project-menu data; it does not replace or cover the native context menu.

Conversation colors use Codex's stable project ID for both local and cloud conversations, including cloud conversations shown separately in recent or pinned lists. A working-directory name shown in an ordinary chat is not treated as project membership.

## Native thread context actions

- **Move to project** and **Remove from project** remain Codex-native operations. Better UI Imropvement does not duplicate or replace them.
- **Title generation default model** is selectable beneath the title-regeneration switch. The plugin reads Codex’s visible model list on every startup/reload and saves your selection locally. It prefers `low` reasoning when supported, otherwise the model’s default. The choice only affects title generation after compaction. Loading failures offer a retry; unavailable selections remain saved and require choosing an available model.
- **Regenerate title** creates a system-scoped temporary working fork, runs Codex's native compaction, and asks the selected model (initial default: `gpt-5.4-mini`) for a structured title in the same compacted context. The working fork is permanently deleted afterwards; the source thread is never compacted or given an extra message.
- **Export Markdown** appears beside Codex's sharing and copy actions. It exports chronological user and assistant text plus local-image path markers, while excluding system/developer context, reasoning, and tool payloads.
- **Delete permanently** uses Codex's native confirmation dialog and deletion API. After confirmation, the dialog closes immediately while deletion continues in the background with a progress notification; success is reported only after the request completes. An existing native menu item uses the same flow without adding a duplicate. Deletion includes subagent tasks and cannot be undone. If the native dialog is unavailable, the plugin reports an error without deleting anything.
- All three additions have independent switches. When any is active, obsolete Codex++ inline More/Delete buttons are hidden without affecting Codex's Pin or Archive controls.
- These actions call the local Codex App Server directly and do not require the Codex++ session-delete bridge or helper service.

## Conversation project colors

- Standalone conversation rows inherit their project's color in the normal sidebar and limited-filter results. Rows inside a project share its enclosing color frame without individual coloring.
- The display uses a soft rounded background, a stronger hover tint, and a thin inset outline for the selected row. There is no leading stripe; titles and unread indicators retain their native styling.
- Conversations without a known project keep Codex's default appearance.
- Turn the feature on or off from **Codex Settings → Script-Loader → Interface enhancements**. Project color choices continue to apply automatically.
- Changing a project color updates currently visible conversation rows immediately.

## Native conversation pagination

Current Codex builds own conversation discovery, grouping, and pagination. Better UI Imropvement no longer calls private history-refresh modules or exposes a separate history limit.

- **Recents** uses Codex's projectless infinite-scroll scope.
- Every project uses its own project-scoped catalog and loads older conversations independently when the project is expanded.
- Pinned conversations remain in Codex's separate pinned container.
- When CC Switch unified session history is enabled, CC Switch/Codex still own the merge. Better UI Imropvement neither reads session files nor creates a second conversation database.

## Usage-data behavior

- The widget waits for the current layout's anchor before appearing, without first mounting in a temporary legacy position. Legacy bottom controls remain supported.
- **Settings → Script-Loader → UI Improvements → Usage** includes an independent app theme button switch. The button stays available with usage disabled and uses the same hover styling as the compact usage control. It saves Codex's native appearance preference.

- Saved quota snapshots are not presented as fresh data after startup.
- The widget accepts only current main-account data from `/wham/usage`; persisted snapshots, renderer events, and page text are not used as quota sources.
- Five-hour and weekly views show remaining percentage and reset-time tooltips.
- The quota control reads only the main account `rate_limit`; `additional_rate_limits` such as GPT-5.3 Codex-specific limits are excluded.
- Credit appears only when actual credit data is available.
- API or pure-API providers show `API`; Better UI Imropvement does not fabricate ChatGPT quota values.
- The standalone `market-hide-usage-alert.js` script is no longer needed because that behavior is built in.

## Quota-prompt filtering

- Hides Codex quota-exhaustion notices and upgrade prompts while keeping conversation content, the composer, and app-update notices visible.
- Works in both the main Codex interface and embedded ChatGPT views.
- Enable or disable it from **Codex Settings → Script-Loader → Interface enhancements**.

## Markdown preview

The right-side Markdown preview enhancement is deliberately limited to:

- Inline and display math: `$...$`, `$$...$$`, `\(...\)`, and `\[...\]`.
- Codex's bundled KaTeX renderer—no external math CDN is required.
- Local and relative image paths resolved from the current document.
- Selecting rendered math to inspect its LaTeX source.

Markdown tables, links, wrapping, and column sizing remain Codex-native. Currency values such as `$25` are not treated as formula delimiters.

![Markdown preview with rendered inline and display math](docs/images/markdown-preview-math.png)

## Compatibility

Better UI Imropvement runs through Codex Script Loader and does not modify the official Codex installation. Features that depend on Codex's interface may need updates after major Codex releases. Codex++ `1.2.4` is retained only as the historical final supported build; active compatibility work is limited to Codex Script Loader.

## Optional companion script

[`scripts/hidden-user-message-visibility-fix.js`](scripts/hidden-user-message-visibility-fix.js) is an independent compatibility fix for user messages hidden by conversation compaction or steering-rendering issues. It is not part of the Better UI Imropvement core script.

## Credits and license

- Active runtime: [JHees/codex-script-loader](https://github.com/JHees/codex-script-loader)
- Legacy Codex++ market snapshot (`1.2.4`): [BigPizzaV3/CodexPlusPlusScriptMarket](https://github.com/BigPizzaV3/CodexPlusPlusScriptMarket)
- Maintained repository: [JHees/better-ui-improvements-for-codex](https://github.com/JHees/better-ui-improvements-for-codex)

Released under the [MIT License](LICENSE). Original copyright, attribution, and permission notices are preserved in the distributed script and [`NOTICE.md`](NOTICE.md).

The interface design was informed by the open-source [Bennett UI plugin](https://github.com/b-nnett/codex-plusplus-bennett-ui). Thank you to its author and contributors for sharing their work.
