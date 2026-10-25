import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const source = await readFile(path.join(repositoryRoot, "scripts/better-ui-imropvement.js"), "utf8");
const definitionsSource = source.match(
  /const FEATURE_DEFINITIONS = Object\.freeze\((\[[\s\S]*?\])\);\s*const FEATURE_IDS/u,
);
const settingsHtmlSource = source.match(
  /(function settingsPanelHtml\(\) \{[\s\S]*?\n  \})\n\n  function refreshSettingsPanel/u,
);
assert.ok(definitionsSource, "canonical feature metadata should exist");
assert.ok(settingsHtmlSource, "the settings panel renderer should exist");

const features = vm.runInNewContext(definitionsSource[1]);
const renderSettingsPanel = () => vm.runInNewContext(
  "(() => { const featureInfo = " + JSON.stringify(features) +
    "; const escapeAttr = value => String(value ?? '');" +
    "const escapeHtmlLocal = escapeAttr; const VERSION = 'test';" +
    settingsHtmlSource[1] +
    "return settingsPanelHtml(); })()",
);

test("settings render an accessible switch for every feature", () => {
  const html = renderSettingsPanel();
  const switches = [...html.matchAll(/<button\b(?=[^>]*\brole="switch")[^>]*>/gu)].map(([tag]) => tag);
  const ids = switches.map((tag) => tag.match(/data-better-ui-imropvement-ui-feature="([^"]+)"/u)?.[1]);

  assert.equal(switches.length, 12);
  assert.deepEqual(ids.slice().sort(), Array.from(features, ({ id }) => id).sort());
  const titles = new Map(Array.from(features, ({ id, title }) => [id, title]));
  for (const tag of switches) {
    const id = tag.match(/data-better-ui-imropvement-ui-feature="([^"]+)"/u)?.[1];
    assert.equal(tag.match(/aria-label="([^"]+)"/u)?.[1], titles.get(id));
    assert.match(tag, /aria-checked="false"/u);
  }
  assert.deepEqual(
    [...html.matchAll(/<h2 class="better-ui-imropvement-ui-section-title">([^<]+)<\/h2>/gu)].map(([, title]) => title),
    ["侧栏", "项目配色", "编辑与会话"],
  );
  assert.match(html, /不可撤销/u);
  assert.doesNotMatch(html, /feature-badge|row-description|需额度数据|LaTeX|可选模型|本地会话|在侧栏显示 5 小时/u);
});

test("palette shortcuts stay visible and custom, advanced, preview, and import controls remain", () => {
  const start = source.indexOf("function bindProjectThemeEditor");
  const end = source.indexOf("\n  function bindSettingsPanel", start);
  const themeEditor = source.slice(start, end);
  const htmlStart = themeEditor.indexOf("root.innerHTML =");
  const customDetails = themeEditor.indexOf("data-theme-custom", htmlStart);

  assert.ok(htmlStart >= 0);
  assert.ok(themeEditor.indexOf("data-theme-preset", htmlStart) < customDetails);
  assert.ok(themeEditor.indexOf("data-theme-mode", htmlStart) < customDetails);
  assert.match(themeEditor, /<summary>自定义配色<\/summary>/u);
  assert.match(themeEditor, /const customOpen = root\.querySelector\("\[data-theme-custom\]"\)\?\.open/u);
  for (const control of [
    "data-theme-edit-mode",
    "data-theme-color",
    "data-theme-path",
    "data-theme-style",
    "data-theme-advanced",
    "data-theme-preview-details",
    "data-theme-json",
    'data-theme-action="export"',
    'data-theme-action="reset"',
    'data-theme-action="save"',
    'data-theme-action="import"',
  ]) {
    assert.ok(themeEditor.includes(control), "missing theme control: " + control);
  }
  assert.match(themeEditor, /导入会替换当前编辑草稿；应用后才保存/u);
  assert.match(
    themeEditor,
    /pending = true;\s*render\(\);\s*root\.querySelector\("\[data-theme-preview-details\]"\)\.open = true;/u,
  );
});

test("title model status is quiet when ready and retry appears only on errors", () => {
  assert.match(source, /status\.textContent = state\.status === "loading" \? "正在读取模型…"[\s\S]*?!available \? "当前模型不可用，请选择其他模型。" : "";/u);
  assert.match(source, /retry\.hidden = state\.status !== "error"/u);
  assert.match(source, /data-better-ui-title-model-retry aria-label="重新读取模型列表" hidden>重试/u);
  assert.doesNotMatch(source, /每次启动重新读取；仅用于压缩后的标题生成/u);
});
