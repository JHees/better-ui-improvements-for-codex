import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const source = await readFile(new URL("../scripts/better-ui-imropvement.js", import.meta.url), "utf8");

// The native sidebar retained its appearance attribute when its layout moved
// from utility classes into a CSS module. Exercise each feature's lookup.
for (const feature of ["sidebar-project-backgrounds", "sidebar-conversation-colors"]) {
  test(`${feature} finds the responsive sidebar after layout classes change`, () => {
    const body = source.slice(source.indexOf(`  "${feature}"(api) {`));
    const selector = body.match(/const ASIDE_SELECTOR = \[[\s\S]*?\]\.join\(", "\);/u)?.[0];
    const lookup = body.match(/const mainSidebar = \(\) => \{[\s\S]*?\n    \};/u)?.[0];
    assert.ok(selector && lookup);
    class Element {
      constructor(classes, appearance = false) { this.classes = new Set(classes.split(" ")); this.appearance = appearance; }
      matches(selector) {
        return selector.split(",").some(part => {
          const candidate = part.trim();
          if (!candidate.startsWith("aside")) return false;
          if (candidate.includes("[data-app-shell-left-panel-appearance]") && !this.appearance) return false;
          return [...candidate.matchAll(/\.([\w-]+)/gu)].every(match => this.classes.has(match[1]));
        });
      }
    }
    const current = new Element("app-shell-left-panel pointer-events-auto relative overflow-visible _LeftPanel_new", true);
    const legacy = new Element("pointer-events-auto relative flex overflow-hidden");
    const unrelated = new Element("settings-sidebar");
    for (const sidebar of [current, legacy]) {
      const document = { querySelector: query => [unrelated, sidebar].find(node => node.matches(query)) ?? null };
      const find = vm.runInNewContext(`${selector}\n${lookup}\nmainSidebar`, { document, HTMLElement: Element });
      assert.equal(find(), sidebar);
    }
  });
}

test("native project headers color their title and icon without an aria-label", () => {
  const body = source.slice(source.indexOf('  "sidebar-project-backgrounds"(api) {'));
  const lookup = body.match(/const nativeProjectRowFor = \(node\) => \{[\s\S]*?\n    \};/u)?.[0];
  const mark = body.match(/const markProjectParts = \(row, label\) => \{[\s\S]*?\n    \};/u)?.[0];
  class Element {
    constructor(kind) { this.kind = kind; this.textContent = kind === "title" ? "Project" : ""; this.marks = {}; }
    matches() { return this.kind === "native"; }
    querySelector(selector) { return this.kind === "group" && selector === "[data-app-action-sidebar-project-row]" ? header : null; }
    querySelectorAll(selector) { return selector === "svg" ? [icon] : selector === "span" ? [title] : []; }
    getBoundingClientRect() { return { width: 120 }; }
  }
  const group = new Element("group"), header = new Element("native"), title = new Element("title"), icon = new Element("icon");
  const run = vm.runInNewContext(`${lookup}\n${mark}\nmarkProjectParts`, {
    HTMLElement: Element, SVGElement: Element, ATTR: "color", normalize: s => s.toLowerCase(),
    labelFor: () => "", setAttr: (node, key, value) => { node.marks[key] = value; },
  });
  run(group, "project");
  assert.equal(title.marks.color, "title");
  assert.equal(icon.marks.color, "icon");
});
