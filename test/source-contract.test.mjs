import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const manifest = JSON.parse(await readFile(path.join(repositoryRoot, "manifest.json"), "utf8"));
const source = await readFile(path.join(repositoryRoot, manifest.main), "utf8");

test("repository owns a self-contained Loader package contract", () => {
  assert.equal(manifest.id, "io.github.jhees.better-ui-imropvement");
  assert.equal(manifest.name, "Better UI Imropvement");
  assert.equal(manifest.version, "1.4.12");
  assert.equal(manifest.lifecycleGlobal, "__betterUiImropvement");
  assert.equal(manifest.settings.mode, "page");
  assert.deepEqual(manifest.permissions, ["dom", "local-storage", "settings"]);
  assert.deepEqual(manifest.update, {
    provider: "github-releases",
    repository: "JHees/better-ui-improvements-for-codex",
    asset: "better-ui-imropvement-{version}.zip",
  });
  assert.match(source, new RegExp(`const VERSION = "${manifest.version.replaceAll(".", "\\.")}"`, "u"));
  assert.match(source, /window\[INSTALL_KEY\] = \{/u);
  assert.match(source, /stop\(\) \{/u);
  assert.match(source, /loaderApi\.settings\.registerPage/u);
  assert.doesNotMatch(source, /__codexScriptLoader\?\.activeApi|__codexScriptLoader\.activeApi/u);
  assert.doesNotThrow(
    () => new vm.Script(`((module, exports, api) => {\n${source}\n})`),
    "the plugin source should compile inside the public Loader injection wrapper",
  );
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
