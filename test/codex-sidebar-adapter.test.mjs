import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const source = await readFile(new URL("../scripts/better-ui-imropvement.js", import.meta.url), "utf8");

test("Codex sidebar adapter owns current and split-rail Usage controls with reversible cleanup", async () => {
  const start = source.indexOf("function createCodexSidebarAdapter(");
  const end = source.indexOf("function isVisibleElement(");
  assert.ok(start >= 0 && end > start, "the Codex sidebar compatibility adapter should exist");

  class Style {
    constructor(value = "", priority = "") { this.value = value; this.priority = priority; }
    getPropertyValue(name) { return name === "display" ? this.value : ""; }
    getPropertyPriority(name) { return name === "display" ? this.priority : ""; }
    setProperty(name, value, priority = "") {
      if (name === "display") { this.value = value; this.priority = priority; }
    }
  }
  class Button {
    constructor(label, { plugin = false, display = "", priority = "" } = {}) {
      this.label = label;
      this.plugin = plugin;
      this.style = new Style(display, priority);
    }
    getAttribute(name) { return name === "aria-label" ? this.label : null; }
    closest(selector) { return selector === "[data-codexpp]" && this.plugin ? this : null; }
  }

  const nativeUsage = new Button("用量", { display: "inline-flex" });
  const pluginUsage = new Button("Usage", { plugin: true, display: "flex" });
  const makeRail = (kind, buttons) => ({
    kind, buttons,
    querySelectorAll() { return this.buttons; },
    matches(selector) { return kind === "current" ? selector.startsWith("nav[data-app-navigation-rail]") : selector.includes("aside.app-shell-left-panel"); },
    closest(selector) { return this.matches(selector) ? this : null; },
    querySelector: () => null,
  });
  const rail = makeRail("current", [nativeUsage, pluginUsage]);
  let currentRails = [rail];
  let splitRail = null;
  let queryCount = 0;
  const document = {
    querySelectorAll(selector) { queryCount += 1; return selector === "nav[data-app-navigation-rail]" ? currentRails : []; },
    querySelector(selector) { queryCount += 1; return selector.includes("group/sidebar-rail") ? splitRail : null; },
  };
  let mutationCallback = null;
  let disconnected = 0;
  const api = { dom: { observe(target, callback, options) {
    assert.equal(target, document);
    assert.deepEqual(Array.from(options.attributeFilter), ["aria-label", "data-app-navigation-rail"]);
    mutationCallback = callback;
    return () => { disconnected += 1; };
  } } };
  const slot = {};
  const context = vm.createContext({
    document,
    queueMicrotask,
    MutationObserver: class { constructor() { throw new Error("Loader observer should be reused"); } },
    createSidebarSlotFinder: () => () => slot,
  });
  vm.runInContext(`${source.slice(start, end)}\nglobalThis.createAdapter = createCodexSidebarAdapter;`, context);
  const adapter = context.createAdapter(api);
  assert.equal(adapter.ensureUsageSlot(), slot);

  const dispose = adapter.hideNativeUsageButtons();
  assert.equal(nativeUsage.style.value, "none");
  assert.equal(nativeUsage.style.priority, "important");
  assert.equal(pluginUsage.style.value, "flex", "plugin-owned controls remain visible");

  const beforeNoise = queryCount;
  mutationCallback([{target: {closest: () => null, matches: () => false, querySelector: () => null}, addedNodes: [], removedNodes: []}]);
  assert.equal(queryCount, beforeNoise, "unrelated chat mutations do not rescan the sidebar");

  const englishUsage = new Button("Usage", { display: "grid", priority: "important" });
  rail.buttons.push(englishUsage);
  mutationCallback([{target: rail, addedNodes: [englishUsage], removedNodes: []}]);
  assert.equal(englishUsage.style.value, "none");

  rail.buttons = [pluginUsage, englishUsage];
  mutationCallback([{target: rail, addedNodes: [], removedNodes: [nativeUsage]}]);
  assert.equal(nativeUsage.style.value, "inline-flex", "removed native controls are restored");

  const splitUsage = new Button("用量", { display: "block" });
  splitRail = makeRail("split", [splitUsage]);
  currentRails = [];
  mutationCallback([{target: document, addedNodes: [splitRail], removedNodes: [rail]}]);
  assert.equal(splitUsage.style.value, "none", "split-only rail controls use the same adapter");
  assert.equal(englishUsage.style.value, "grid");

  dispose();
  dispose();
  assert.equal(splitUsage.style.value, "block");
  assert.equal(disconnected, 1);
  adapter.stop();
});
