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

test("the project frame encloses its sibling chat list without individual chat colors", () => {
  const backgrounds = source.slice(source.indexOf('  "sidebar-project-backgrounds"(api) {'));
  const colors = source.slice(source.indexOf('  "sidebar-conversation-colors"(api) {'));
  const candidates = backgrounds.match(/    const candidateRows = \(sidebar\) =>[\s\S]*?rows.indexOf\(node\) === index\);/u)[0];
  const constants = colors.match(/    const THREAD_SELECTOR =[\s\S]*?    const PALETTE_FALLBACK/u)[0].replace(/    const PALETTE_FALLBACK$/u, "");
  const functions = ["attrValue", "projectInfo", "projectForThread"].map(name =>
    colors.match(new RegExp(`    const ${name} = \\([\\s\\S]*?\\n    \\};`, "u"))[0],
  ).join("\n");
  class Element {
    constructor(attributes = {}, children = []) {
      this.attributes = attributes;
      this.children = children;
      for (const child of children) child.parentElement = this;
    }
    getAttribute(name) { return this.attributes[name] ?? null; }
    matches(selector) {
      return selector.split(",").some(part => {
        const base = part.trim();
        if (base.startsWith(".")) return this.attributes.class === base.slice(1).replaceAll("\\", "");
        const attrs = [...base.matchAll(/\[([\w-]+)(?:=['"]?([^\]'"\s]+)['"]?)?\]/gu)];
        return attrs.length > 0 && attrs.every(([, name, value]) =>
          name in this.attributes && (value === undefined || this.attributes[name] === value),
        );
      });
    }
    querySelector(selector) { return this.querySelectorAll(selector)[0] ?? null; }
    querySelectorAll(selector) { return this.children.flatMap(child => [...(child.matches(selector) ? [child] : []), ...child.querySelectorAll(selector)]); }
    closest(selector) { return this.matches(selector) ? this : this.parentElement?.closest(selector) ?? null; }
  }
  const header = new Element({"data-app-action-sidebar-project-row": "", "data-app-action-sidebar-project-id": "project-1", "data-app-action-sidebar-project-label": "ICASSP"});
  const chat = () => new Element({role: "button", "aria-label": "Chat", "data-app-action-sidebar-thread-row": ""}, [new Element({"data-thread-title": "true"})]);
  const threads = [chat(), chat(), chat()];
  const container = new Element({"data-sidebar-project-kind": "local", "data-sidebar-project-container-id": "project:project-1"}, [
    new Element({}, [header, new Element({}, [new Element({role: "list"}, threads.map(thread => new Element({role: "listitem"}, [thread])))])]),
  ]);
  const unrelated = chat();
  const sidebar = new Element({}, [container, unrelated]);
  const run = vm.runInNewContext(`${constants}\n${functions}\n${candidates}\n({candidateRows, projectForThread})`, {
    HTMLElement: Element, normalize: value => String(value || "").trim().toLowerCase(),
    isProjectRow: () => true,
    reactProjectInfo: () => false, secondaryProjectInfo: () => null,
  });
  const rows = run.candidateRows(sidebar);
  assert.equal(rows.length, 1);
  assert.equal(rows[0], container, "background and border must be applied to the whole project container");
  const index = {byId: new Map(), byList: new Map()};
  for (const thread of threads) {
    assert.equal(run.projectForThread(thread, index), null, "project children must not receive individual conversation colors");
  }
  assert.equal(run.projectForThread(unrelated, index), null, "a nearby project must not color an unassigned chat");
  const legacy = new Element({"data-app-action-sidebar-thread-row": "", "data-app-action-sidebar-project-id": "legacy"});
  assert.equal(run.projectForThread(legacy, index).id, "legacy");
  const legacyGroup = new Element({role: "listitem", "aria-label": "Legacy", class: "group/cwd"}, [
    new Element({"data-app-action-sidebar-project-row": ""}), legacy,
  ]);
  assert.equal(run.candidateRows(legacyGroup)[0], legacyGroup);
  assert.equal(run.projectForThread(legacy, index), null);
});

test("standalone cloud conversations resolve their native project id and share the project palette", () => {
  const body = source.slice(source.indexOf('  "sidebar-conversation-colors"(api) {'));
  const functions = ["reactProjectInfo", "projectForThread"].map(name =>
    body.match(new RegExp(`    const ${name} = \\([\\s\\S]*?\\n    \\};`, "u"))[0],
  ).join("\n");
  const project = {id: "g-p-cloud", label: "Cloud project", key: "id:g-p-cloud"};
  const index = {byId: new Map([[project.id, project]]), byList: new Map()};
  const resolve = vm.runInNewContext(`${functions}\nprojectForThread`, {
    PROJECT_SELECTOR: "project", PROJECT_LIST_SELECTOR: "list", PROJECT_ID_ATTRS: [], PROJECT_LABEL_ATTRS: [],
    normalize: value => String(value || "").trim().toLowerCase(), attrValue: () => "", projectInfo: () => null,
    secondaryProjectInfo: () => ({id: "", label: "Misleading directory name"}),
  });
  const thread = props => {
    let fiber = {memoizedProps: props};
    for (let depth = 0; depth < 9; depth += 1) fiber = {memoizedProps: {}, return: fiber};
    return {__reactFiber$fixture: fiber, closest: () => null};
  };
  assert.equal(resolve(thread({conversationId: "cloud-chat", projectId: project.id}), index), project);
  assert.equal(resolve(thread({conversationId: "cloud-chat", projectId: null}), index), null);
  assert.equal(resolve(thread({conversationId: "cloud-chat", projectId: " "}), index), null);
  const unavailable = resolve(thread({conversationId: "cloud-chat", projectId: "g-p-collapsed"}), index);
  assert.equal(unavailable.id, "g-p-collapsed");
  const local = resolve(thread({hoverCardProjectId: "local-project", hoverCardProjectLabel: "Local"}), index);
  assert.equal(local.id, "local-project");
  assert.equal(local.label, "Local");
  assert.equal(resolve(thread({isProjectlessHoverCard: true, hoverCardProjectLabel: "Local"}), index), null);
});
