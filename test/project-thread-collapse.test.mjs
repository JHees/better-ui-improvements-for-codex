import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const source = await readFile(new URL("../scripts/better-ui-imropvement.js", import.meta.url), "utf8");
const feature = source.slice(source.indexOf("function committedSidebarFiber("), source.indexOf("const FEATURES ="));

test("collapse follows the committed project list from intermediate pages to the last page", () => {
  let frame, notify, disposed = false;
  class Node {
    constructor(tag) { this.tagName = tag.toUpperCase(); this.dataset = {}; this.attrs = new Map(); this.style = {setProperty() {}}; }
    setAttribute(name, value) { this.attrs.set(name, value); }
    getAttribute(name) { return this.attrs.get(name); }
    hasAttribute(name) { return this.attrs.has(name); }
    append(node) { this.firstElementChild = node; node.parentElement = this; }
    replaceChildren(node) { this.append(node); }
    cloneNode(deep) {
      const copy = new Node(this.tagName);
      copy.className = this.className;
      copy.attrs = new Map(this.attrs);
      if (deep && this.firstElementChild) copy.append(this.firstElementChild.cloneNode(true));
      return copy;
    }
    remove() { if (this.anchor) this.anchor.nextElementSibling = null; this.anchor = null; }
  }
  const more = new Node("button");
  const nativeRow = new Node("div");
  nativeRow.className = "native-footer";
  nativeRow.append(more);
  more.className = "native-button";
  more.classList = ["Button-current"];
  more.setAttribute("data-variant", "ghost");
  more.setAttribute("data-size", "xs");
  more.setAttribute("id", "native-action");
  more.after = placeAfter;
  more.append(new Node("span"));
  more.firstElementChild.className = "native-inner";
  more.firstElementChild.append(new Node("span"));
  more.firstElementChild.firstElementChild.className = "text-base";
  function placeAfter(button) {
    button.remove();
    button.anchor = this;
    this.nextElementSibling = button;
  }
  function attach(node, props) {
    const current = {memoizedProps: {}, return: {memoizedProps: props}};
    // The DOM may still point at the alternate from before the user expanded the list.
    node.__reactProps$test = current.memoizedProps;
    node.__reactFiber$test = {memoizedProps: {}, alternate: current};
  }
  attach(more, {children: [null, {props: {id: "sidebarElectron.showMore"}}]});
  let footer = more, visible = 15;
  const list = {lastElementChild: {querySelector: () => footer}, after: placeAfter,
    isConnected: true, closest: () => true};
  const props = {expanded: true, maxItems: 5, items: Array(24),
    onExpandedChange(expanded) { props.expanded = expanded; visible = expanded ? 15 : props.maxItems; }};
  attach(list, props);
  const document = {
    documentElement: {lang: "zh-CN"},
    querySelectorAll(selector) {
      assert.equal(selector, '[data-sidebar-project-container-id] [role="list"]');
      return [list];
    },
    querySelector: () => more,
    createElement: tag => new Node(tag),
  };
  const install = vm.runInNewContext(feature + "\ninstallProjectThreadCollapse", {
    document, mutationsAffect: () => true,
    MutationObserver: class { constructor(fn) { notify = fn; } observe() {} disconnect() { disposed = true; } },
    requestAnimationFrame(fn) { frame = fn; return 1; }, cancelAnimationFrame() {},
  });
  const dispose = install();
  const refresh = () => { notify([]); frame(); };
  const firstRow = more.nextElementSibling;
  assert.equal(firstRow.className, "contents");
  function verifyButton(row) {
    const button = row.firstElementChild;
    assert.equal(button.className, "native-button");
    assert.equal(button.getAttribute("data-variant"), "ghost");
    assert.equal(button.getAttribute("data-size"), "xs");
    assert.equal(button.hasAttribute("id"), false);
    assert.equal(button.firstElementChild.className, "native-inner");
    assert.equal(button.firstElementChild.firstElementChild.className, "text-base");
    assert.equal(button.firstElementChild.firstElementChild.textContent, "收起");
    return button;
  }
  verifyButton(firstRow).onclick();
  refresh();
  assert.equal(visible, 5);
  assert.equal(firstRow.anchor, null);
  props.expanded = true;
  refresh();
  const row = more.nextElementSibling;
  footer = null;
  refresh();
  assert.equal(list.nextElementSibling, row);
  assert.equal(row.className, "native-footer");
  verifyButton(row);
  props.showLessButton = true;
  refresh();
  assert.equal(row.anchor, null);
  props.showLessButton = false;
  list.__reactProps$test = {};
  refresh();
  assert.equal(list.nextElementSibling, null);
  dispose();
  assert.equal(disposed, true);

  attach(list, props);
  const stopStandalone = install();
  const standalone = list.nextElementSibling.firstElementChild;
  assert.equal(standalone.className, "Button-current");
  assert.equal(standalone.dataset.variant, "ghost");
  assert.equal(standalone.dataset.size, "xs");
  assert.equal(standalone.firstElementChild.firstElementChild.className, "text-base");
  footer = more;
  refresh();
  verifyButton(more.nextElementSibling);
  stopStandalone();
});
