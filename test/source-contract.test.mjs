import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const manifest = JSON.parse(await readFile(path.join(repositoryRoot, "manifest.json"), "utf8"));
const source = await readFile(path.join(repositoryRoot, manifest.main), "utf8");
const releaseWorkflow = await readFile(path.join(repositoryRoot, ".github/workflows/release.yml"), "utf8");

test("repository owns a self-contained Loader package contract", () => {
  assert.equal(manifest.id, "io.github.jhees.better-ui-imropvement");
  assert.equal(manifest.name, "Better UI Imropvement");
  assert.equal(manifest.version, "1.4.16");
  assert.equal(manifest.lifecycleGlobal, "__betterUiImropvement");
  assert.equal(manifest.settings.mode, "page");
  assert.deepEqual(manifest.permissions, ["dom", "local-storage", "settings"]);
  assert.deepEqual(manifest.update, {
    provider: "github-releases",
    repository: "JHees/better-ui-improvements-for-codex",
    asset: "better-ui-imropvement-{version}.zip",
  });
  assert.match(source, new RegExp(`const VERSION = "${manifest.version.replaceAll(".", "\\.")}"`, "u"));
  assert.match(source, /const LOADER_STORAGE_PREFIX = "codex-script-loader:io\.github\.jhees\.better-ui-imropvement:"/u);
  assert.match(source, /const LEGACY_LOADER_STORAGE_PREFIX = "codex-script-loader:co\.bennett\.ui-improvements:"/u);
  assert.match(source, /window\[INSTALL_KEY\] = \{/u);
  assert.match(source, /stop\(\) \{/u);
  assert.match(source, /loaderApi\.settings\.registerPage/u);
  assert.doesNotMatch(source, /__codexScriptLoader\?\.activeApi|__codexScriptLoader\.activeApi/u);
  assert.doesNotThrow(
    () => new vm.Script(`((module, exports, api) => {\n${source}\n})`),
    "the plugin source should compile inside the public Loader injection wrapper",
  );
});

test("tag releases bind GitHub CLI to the repository without a checkout", () => {
  assert.match(releaseWorkflow, /GH_REPO:\s*\$\{\{ github\.repository \}\}/u);
});

test("current renderer compatibility behavior remains covered in this repository", () => {
  assert.match(source, /show-usage-in-sidebar/u);
  assert.match(source, /sidebar-project-backgrounds/u);
  assert.match(source, /sidebar-conversation-colors/u);
  assert.match(source, /render-markdown-preview-math/u);
  assert.match(source, /slash-menu-polish/u);
  assert.match(source, /thread-title-regeneration/u);
  assert.match(source, /thread-markdown-export/u);
  assert.match(source, /thread-permanent-delete/u);
  assert.match(source, /nativeHttpClientModuleUrls/u);
  assert.match(source, /app-initial-/u);
  assert.match(source, /typeof value\.safeGet !== "function"/u);
  assert.match(source, /return await fetchWithNativeHttpClient\(url\)/u);
  assert.match(source, /data-app-action-sidebar-thread-pinned="true"\] \.icon-leading-slot/u);
  assert.match(source, /PINNED_THREAD_ICON_STYLE_ID/u);
  assert.doesNotMatch(source, /api\.process/u);
  assert.doesNotMatch(source, /require\("electron"\)/u);
});

test("feature identifiers are stable and owned by the plugin", () => {
  const definitions = source.match(
    /const FEATURE_DEFINITIONS = Object\.freeze\(\[(.*?)\]\);\s*const FEATURE_IDS/su,
  );
  assert.ok(definitions, "canonical feature definitions should exist");
  const featureIds = [...definitions[1].matchAll(/\bid:\s*"([a-z0-9-]+)"/gu)].map(match => match[1]);
  assert.deepEqual(featureIds, [
    "hide-upgrade-prompts",
    "show-usage-in-sidebar",
    "hide-usage-alert",
    "sidebar-project-backgrounds",
    "sidebar-conversation-colors",
    "render-markdown-preview-math",
    "slash-menu-polish",
    "thread-title-regeneration",
    "thread-markdown-export",
    "thread-permanent-delete",
  ]);
});

test("current Codex thread menu factories remain discoverable", () => {
  const legacyMarkers = source.match(
    /const LEGACY_MENU_SOURCE_MARKERS = Object\.freeze\(\[(.*?)\]\);/su,
  );
  const factoryMatcher = source.match(
    /function isThreadMenuFactorySource\(sourceText\) \{([\s\S]*?)\n  \}/u,
  );
  assert.ok(legacyMarkers, "legacy menu markers should remain declared");
  assert.ok(factoryMatcher, "the thread menu factory compatibility matcher should exist");

  const isThreadMenuFactorySource = vm.runInNewContext(`
    const LEGACY_MENU_SOURCE_MARKERS = Object.freeze([${legacyMarkers[1]}]);
    (function isThreadMenuFactorySource(sourceText) {${factoryMatcher[1]}\n  });
  `);
  const currentCodexFactory =
    "()=>gLc({scope:T,surface:`sidebar`,isUnread:a??!1,target:{conversationId:n,hostId:M,cwd:xe},actions:re,canPin:x,onRename:Re,onArchive:Pe})";
  const legacyCodexFactory =
    "()=>['rename-thread','archive-thread','move-thread-to-project','copy-thread-actions']";

  assert.equal(isThreadMenuFactorySource(currentCodexFactory), true);
  assert.equal(isThreadMenuFactorySource(legacyCodexFactory), true);
  assert.equal(isThreadMenuFactorySource("() => ['archive-thread']"), false);
  assert.match(source, /"copy-actions"/u);
  assert.match(source, /"window-separator"/u);
});

test("thread action switches remain in the settings page", () => {
  const editorGroup = source.match(
    /id:\s*"editor",\s*title:\s*"编辑与会话",\s*features:\s*\[(.*?)\]/su,
  );
  assert.ok(editorGroup, "the editor and thread settings group should exist");
  const featureIds = [...editorGroup[1].matchAll(/"([a-z0-9-]+)"/gu)].map(match => match[1]);
  assert.deepEqual(featureIds, [
    "render-markdown-preview-math",
    "slash-menu-polish",
    "thread-title-regeneration",
    "thread-markdown-export",
    "thread-permanent-delete",
  ]);
  assert.match(
    source,
    /data-better-ui-imropvement-ui-feature="\$\{escapeAttr\(item\.id\)\}"/u,
  );
  assert.match(source, /role="switch"/u);
});

test("settings root attribute scopes the switch styles", () => {
  assert.match(
    source,
    /root\.dataset\.betterUiImropvementUiSettingsRoot = "true"/u,
    "the rendered settings root must expose the data attribute used by its scoped CSS",
  );
  assert.match(
    source,
    /delete root\.dataset\.betterUiImropvementUiSettingsRoot/u,
    "the matching settings-root data attribute should be removed during cleanup",
  );
  assert.match(
    source,
    /\[data-better-ui-imropvement-ui-settings-root="true"\] \.better-ui-imropvement-ui-toggle/u,
    "switch dimensions and colors must be scoped to the rendered settings root",
  );
});

test("permanent delete follows the system danger styling contract", () => {
  const deleteItem = source.match(
    /id:\s*DELETE_ITEM_ID,[\s\S]{0,500}?onSelect:\s*\(\) => void deleteThreadPermanently\(context\)/u,
  );
  assert.ok(deleteItem, "the permanent-delete menu item should exist");
  assert.doesNotMatch(
    deleteItem[0],
    /variant:\s*"destructive"/u,
    "Codex's menu item variant must stay at its default so danger tone can apply",
  );
  assert.match(
    deleteItem[0],
    /icon:\s*svgIcon\(DELETE_ICON_PATH,\s*systemDangerColor\(\)\)/u,
    "Electron's native menu should receive a system-danger-colored trash icon",
  );
  assert.match(deleteItem[0], /tone:\s*"danger"/u);
  assert.match(source, /function systemDangerColor\(\)/u);
});
