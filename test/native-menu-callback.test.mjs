import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const source = await readFile(new URL("../scripts/better-ui-imropvement.js", import.meta.url), "utf8");

function makeHarness({ rows = [], threadContext = { threadId: "thread-1" } } = {}) {
  const adapterStart = source.indexOf("  function createStableMenuRef(");
  const restoreStart = source.indexOf("  function restoreMenuRef(", adapterStart);
  const appendStart = source.indexOf("  function appendThreadActions(", restoreStart);
  const patchStart = source.indexOf("  function patchMenus() {");
  const patchEnd = source.indexOf("  function schedulePatch(", patchStart);
  assert.ok(adapterStart >= 0 && restoreStart > adapterStart && appendStart > restoreStart, "the stable native menu ref adapter should exist");
  assert.ok(patchStart >= 0 && patchEnd > patchStart, "the menu patcher should exist");

  let appendCount = 0;
  const context = vm.createContext({
    THREAD_SELECTOR: "thread-row",
    stableMenuRefs: new WeakMap(),
    patchedMenuRefs: new Map(),
    reactFiberFor: row => row.fiber,
    isThreadMenuFactorySource: sourceText => sourceText.includes("native-menu"),
    document: { querySelectorAll: () => rows },
    titleWorkingThreadIds: new Set(),
    enabledActions: new Set(["test-action"]),
    operationEpoch: 0,
    threadContextFor: () => threadContext,
    appendThreadActions(items, menuContext) {
      appendCount += 1;
      return { ...items, actions: [menuContext.threadId], appendCount };
    },
    log() {},
  });
  vm.runInContext(
    `${source.slice(adapterStart, appendStart)}\n` +
    `${source.slice(patchStart, patchEnd)}\n` +
    `globalThis.menuHarness = { threadMenuRefFor, restoreMenuRef, patchMenus, patchedMenuRefs };`,
    context,
  );
  return {
    context,
    menu: context.menuHarness,
    setRows(nextRows) { rows = nextRows; },
    setContext(nextContext) { threadContext = nextContext; },
    get appendCount() { return appendCount; },
  };
}

function makeNative(version, calls, rejection = null, pending = new Map()) {
  return function nativeMenuFactory(...args) {
    const codexFactoryMarker = "native-menu";
    calls.push({ version, receiver: this, args });
    if (String(args[0]).startsWith("pending-")) {
      return new Promise(resolve => pending.set(args[0], resolve));
    }
    if (args[0] === "reject") return Promise.reject(rejection);
    return { version, channel: args[0], args, receiver: this, codexFactoryMarker };
  };
}

function makeRow(native) {
  let target = native;
  const state = {
    callback: function (...args) { return target.apply(this, args); },
    update(next) { target = next; },
  };
  const nativeHook = { memoizedState: { deps: [native] }, next: null };
  const callbackHook = { memoizedState: state, next: nativeHook };
  const row = {
    fiber: { memoizedState: callbackHook, return: null },
    getAttribute(name) { return name === "data-app-action-sidebar-thread-id" ? "local:thread-1" : null; },
    setAttribute() {},
    removeAttribute() {},
  };
  return { row, state, nativeHook, setNativeTarget(next) { target = next; } };
}

test("native context-menu and row-actions calls keep their receiver and arguments through duplicate scans", () => {
  const calls = [];
  const native = makeNative("initial", calls);
  const { row, state } = makeRow(native);
  const harness = makeHarness({ rows: [row] });
  const callback = state.callback;

  harness.menu.patchMenus();
  const ref = harness.menu.threadMenuRefFor(row);
  harness.menu.patchMenus();

  assert.equal(state.callback, callback, "React keeps its callback identity while the target is patched");
  assert.equal(harness.menu.threadMenuRefFor(row), ref, "repeated scans reuse the stable ref facade");

  const receiver = { name: "Codex menu owner" };
  for (const channel of ["context-menu", "row-actions"]) {
    const args = [channel, { threadId: "thread-1" }, 17];
    const result = callback.apply(receiver, args);
    assert.equal(result.version, "initial");
    assert.equal(result.channel, channel);
    assert.equal(result.receiver, receiver);
    assert.deepEqual(Array.from(result.args), args);
    assert.deepEqual(Array.from(result.actions), ["thread-1"]);
  }

  assert.equal(calls.length, 2);
  assert.equal(calls[0].receiver, receiver);
  assert.deepEqual(Array.from(calls[0].args), ["context-menu", { threadId: "thread-1" }, 17]);
  assert.equal(harness.appendCount, 2, "the native result is extended once per invocation");
});

test("native callback updates refresh repeatedly, propagate rejection, and restore the latest factory", async () => {
  const calls = [];
  const rejection = new Error("native menu unavailable");
  const pending = new Map();
  const initial = makeNative("initial", calls, rejection, pending);
  const { row, state } = makeRow(initial);
  const initialContext = { threadId: "thread-before-update" };
  const harness = makeHarness({ rows: [row], threadContext: initialContext });
  const originalUpdate = state.update;
  const callback = state.callback;

  harness.menu.patchMenus();
  const receiver = { id: "menu" };
  assert.equal(callback.call(receiver, "first").version, "initial");

  const second = makeNative("second", calls, rejection, pending);
  state.update(second);
  assert.equal(state.callback, callback, "React keeps its callback identity after the first update");
  assert.equal(callback.call(receiver, "second").version, "second");

  const latest = makeNative("latest", calls, rejection, pending);
  state.update(latest);
  assert.equal(state.callback, callback, "later React updates keep React's callback identity");
  assert.equal(callback.call(receiver, "latest").version, "latest");
  await assert.rejects(callback.call(receiver, "reject"), error => error === rejection);

  const contextPending = callback.call(receiver, "pending-context");
  harness.setContext({ threadId: "thread-after-update" });
  harness.menu.patchMenus();
  const contextItems = { version: "context-pending-result" };
  pending.get("pending-context")(contextItems);
  const contextResult = await contextPending;
  assert.equal(contextResult.version, "context-pending-result");
  assert.deepEqual(Array.from(contextResult.actions), ["thread-before-update"], "pending work keeps its invocation's row context");

  const stopPending = callback.call(receiver, "pending-stop");
  const stoppedItems = { version: "stopped-result" };
  harness.context.operationEpoch += 1;
  pending.get("pending-stop")(stoppedItems);
  assert.equal(await stopPending, stoppedItems, "a successful result completing after stop remains unmodified");

  harness.setRows([]);
  harness.menu.patchMenus();
  assert.equal(state.update, originalUpdate, "cleanup restores the original update function");
  assert.equal(state.callback, callback, "React's callback identity survives cleanup");
  const restored = callback.call(receiver, "after-cleanup");
  assert.equal(restored.version, "latest");
  assert.equal(restored.receiver, receiver);
  assert.equal(harness.menu.patchedMenuRefs.size, 0);
});

test("an externally replaced update function survives cleanup and a later enable gets a fresh native factory", () => {
  const calls = [];
  const initial = makeNative("initial", calls);
  const { row, state, nativeHook, setNativeTarget } = makeRow(initial);
  const harness = makeHarness({ rows: [row] });
  const callback = state.callback;

  harness.menu.patchMenus();
  const firstFacade = harness.menu.threadMenuRefFor(row);
  const externalUpdate = function (next) { setNativeTarget(next); };
  state.update = externalUpdate;
  const replacement = makeNative("replacement", calls);
  nativeHook.memoizedState.deps[0] = replacement;

  harness.menu.patchMenus();
  const replacementFacade = harness.menu.threadMenuRefFor(row);
  assert.notEqual(replacementFacade, firstFacade, "a replaced update function gets a new adapter");
  assert.equal(callback.call({ id: "replacement" }, "row-actions").version, "replacement");

  harness.setRows([]);
  harness.menu.patchMenus();
  assert.equal(state.update, externalUpdate, "cleanup preserves Codex's replacement update function");
  assert.equal(callback.call({}, "after-cleanup").version, "replacement");

  const fresh = makeNative("fresh-after-enable", calls);
  nativeHook.memoizedState.deps[0] = fresh;
  harness.setRows([row]);
  harness.menu.patchMenus();
  const freshFacade = harness.menu.threadMenuRefFor(row);
  assert.notEqual(freshFacade, replacementFacade, "re-enable creates a facade around the newly rendered native factory");
  const result = callback.call({ id: "fresh" }, "context-menu");
  assert.equal(result.version, "fresh-after-enable");
  assert.equal(state.callback, callback);
  assert.notEqual(state.update, externalUpdate, "the new adapter is active while enabled");
  harness.setRows([]);
  harness.menu.patchMenus();
  assert.equal(state.update, externalUpdate);
  assert.equal(callback.call({}, "after-cleanup").version, "fresh-after-enable");
});
