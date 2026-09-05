import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const source = await readFile(new URL("../scripts/better-ui-imropvement.js", import.meta.url), "utf8");
const modelFunctions = source.slice(source.indexOf("function createTitleModelSettings("), source.indexOf("function createSessionThreadActionsManager("));
const { createTitleModelSettings, readTitleModels } = vm.runInNewContext(`${modelFunctions}\n({ createTitleModelSettings, readTitleModels });`);
const mini = { model: "gpt-5.4-mini", displayName: "GPT-5.4-Mini", supportedReasoningEfforts: [{ reasoningEffort: "low" }], defaultReasoningEffort: "medium" };
const other = { model: "another-model", displayName: "Another model", supportedReasoningEfforts: [{ reasoningEffort: "high" }], defaultReasoningEffort: "high" };
const flush = () => new Promise(resolve => setImmediate(resolve));

function harness(loadModels = async () => [mini, other], values = new Map()) {
  const timers = new Map();
  const changes = [];
  let nextId = 0;
  const settings = createTitleModelSettings({
    storage: { get: (key, fallback) => values.get(key) ?? fallback, set: (key, value) => values.set(key, value) },
    loadModels,
    onChange: state => changes.push(state),
    setTimer: (callback, delay) => { timers.set(++nextId, { callback, delay }); return nextId; },
    clearTimer: id => timers.delete(id),
  });
  return { settings, timers, changes, values };
}

test("Codex model pages preserve names and model identifiers, filter hidden entries and deduplicate", async () => {
  const calls = [];
  const models = await readTitleModels({ sendRequest: async (method, params) => {
    calls.push({ method, ...params });
    return params.cursor ? { result: { data: [mini, other], nextCursor: null } } :
      { data: [{ ...mini, id: "not-the-request-model" }, { model: "hidden", hidden: true }], nextCursor: "page-2" };
  } });
  assert.deepEqual(Array.from(models, m => [m.model, m.displayName]), [[mini.model, mini.displayName], [other.model, other.displayName]]);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].method, "model/list");
  assert.equal(calls[0].includeHidden, false);
  assert.equal(calls[1].cursor, "page-2");
});

test("malformed and cyclic model pages report errors", async () => {
  await assert.rejects(readTitleModels({ sendRequest: async () => ({}) }), /Invalid/);
  await assert.rejects(readTitleModels({ sendRequest: async () => ({ data: [], nextCursor: "same" }) }), /Repeated/);
});

test("model discovery works on settings pages without sidebar rows", () => {
  const scope = { query: {}, queryClient: {}, get() {}, set() {}, watch() {}, when() {} };
  const shared = { memoizedState: null };
  const empty = { fiber: { memoizedState: null, return: shared } };
  const settings = { fiber: { memoizedState: { memoizedState: { scope } }, return: shared } };
  const functions = source.slice(source.indexOf("  function scopeFromRow("), source.indexOf("  function localModuleUrl("));
  const find = vm.runInNewContext(`${functions}\nnativeScopeElement`, {
    THREAD_SELECTOR: "threads", reactFiberFor: el => el.fiber,
    document: { querySelectorAll: selector => selector === "threads" ? [] : [empty, settings] },
  });
  assert.equal(find(), settings);
});

test("Mini is the initial default; a saved choice survives a fresh startup and uses supported effort", async () => {
  const h = harness();
  assert.equal(h.settings.selectedModel(), mini.model);
  await h.settings.refresh();
  assert.equal((await h.settings.resolve(mini.model)).effort, "low");
  assert.equal(h.settings.select(other.model), true);
  assert.equal(h.settings.select("unknown"), false);
  h.settings.stop();
  let reads = 0;
  const fresh = harness(async () => { reads++; return [mini, other]; }, h.values);
  fresh.settings.start();
  await flush();
  assert.equal(reads, 1);
  assert.equal(fresh.settings.selectedModel(), other.model);
  assert.equal((await fresh.settings.resolve(other.model)).effort, "high");
  fresh.settings.stop();
});

test("startup retries an unavailable client and resolves the current model list", async () => {
  let reads = 0;
  const h = harness(async () => { if (++reads === 1) throw new Error("not ready"); return [mini]; });
  h.settings.start();
  await flush();
  assert.equal(h.settings.snapshot().status, "error");
  const [id, retry] = [...h.timers].find(([, timer]) => timer.delay === 500);
  h.timers.delete(id);
  retry.callback();
  await flush();
  assert.equal(h.settings.snapshot().status, "ready");
  assert.equal(reads, 2);
  h.settings.stop();
  assert.equal(h.timers.size, 0);
});

test("generation retries failed loading but never substitutes an unavailable selection", async () => {
  let fail = true;
  const h = harness(async () => { if (fail) throw new Error("offline"); return [mini]; });
  await h.settings.refresh();
  await assert.rejects(h.settings.resolve(mini.model), /offline/);
  fail = false;
  assert.equal((await h.settings.resolve(mini.model)).model, mini.model);
  h.values.set("title-generation:model", other.model);
  await assert.rejects(h.settings.resolve(other.model), /当前不可用/);
  assert.equal(h.settings.selectedModel(), other.model);
  h.settings.stop();
});

test("concurrent reads share one request, timed-out and stopped requests cannot update settings", async () => {
  let finish;
  let reads = 0;
  const h = harness(() => { reads++; return new Promise(resolve => { finish = resolve; }); });
  const first = h.settings.refresh();
  assert.equal(h.settings.refresh(), first);
  await flush();
  assert.equal(reads, 1);
  [...h.timers.values()][0].callback();
  await first;
  assert.equal(h.settings.snapshot().status, "error");
  finish([mini]);
  await flush();
  assert.equal(h.settings.snapshot().status, "error");
  const pending = h.settings.refresh();
  await flush();
  h.settings.stop();
  const changeCount = h.changes.length;
  finish([other]);
  await pending;
  assert.equal(h.changes.length, changeCount);
  assert.equal(h.timers.size, 0);
});

const regenerationFunction = source.slice(source.indexOf("  async function regenerateThreadTitle(context)"), source.indexOf("  async function exportThread(context)"));
function generationHarness({ output = "新的测试标题", failure = false, latestTitle = "原标题" } = {}) {
  const calls = [];
  const h = harness();
  let releaseCompaction;
  const compacted = new Promise(resolve => { releaseCompaction = resolve; });
  let readCount = 0;
  const client = { sendRequest: async (method, payload) => {
    calls.push({ method, payload });
    if (method === "thread/read") return { thread: { name: ++readCount === 1 ? "原标题" : latestTitle, status: "idle", cwd: "test" } };
    if (method === "turn/start") { if (failure) throw new Error("generation failed"); return { turn: { id: "title-turn" } }; }
    return {};
  } };
  const noop = () => {};
  const context = {
    SESSION_ACTION_REGENERATE_TITLE: "regenerate-title", titleModelSettings: h.settings,
    inFlight: new Set(), operationEpoch: 0, schedulePatch: noop, oneLine: v => v,
    labels: () => ({ untitledThread: "untitled", compactingTitle: "{title}", generatingTitle: "{title}", titleUnavailable: "invalid title", titleRegenerated: "{title}", titleUnchanged: "{title}", titleChanged: "{title}", titleError: "{title}: {error}" }),
    compactProgressText: v => v, scopeFromRow: noop,
    showTitleProgress: async () => ({ update: noop, dismiss: noop }), nativeClientFor: async () => client,
    threadFromResponse: v => v.thread, threadTitleValue: t => t.name,
    forkTitleWorkingThread: async (_client, payload) => { calls.push({ method: "fork", payload }); return { threadId: "working" }; },
    TITLE_THREAD_CONFIG: { model_reasoning_effort: "low" }, TITLE_OUTPUT_SCHEMA: {},
    persistedCompactionTurnIds: async () => new Set(), watchThreadCompaction: () => ({ promise: compacted, cancel: noop }),
    compactedTitlePrompt: () => "generate title", watchThreadTurn: () => ({ promise: Promise.resolve(output) }), titleFromTurn: v => v,
    log: noop, discardTitleWorkingThread: async (_client, threadId) => calls.push({ method: "discard", threadId }),
    titleWorkingThreadIds: new Set(), notificationGuardedThreadIds: new Set(), patchMenus: noop,
  };
  const generate = vm.runInNewContext(`${regenerationFunction}\nregenerateThreadTitle`, context);
  return { ...h, calls, releaseCompaction, generate: () => generate({ threadId: "source", threadKey: "local:source", title: "原标题" }) };
}

test("generation freezes the selected model before compaction and cleans its working fork", async () => {
  const h = generationHarness();
  await h.settings.refresh();
  const operation = h.generate();
  await flush();
  h.settings.select(other.model);
  h.releaseCompaction();
  const result = await operation;
  const turn = h.calls.find(c => c.method === "turn/start").payload;
  assert.equal(turn.model, mini.model);
  assert.equal(turn.effort, "low");
  assert.equal(h.calls.find(c => c.method === "fork").payload.model, undefined);
  assert.equal(h.calls.find(c => c.method === "thread/compact/start").payload.threadId, "working");
  assert.equal(result.status, "updated");
  assert.equal(result.model, mini.model);
  assert.equal(h.calls.find(c => c.method === "thread/name/set").payload.threadId, "source");
  assert.equal(h.calls.at(-1).threadId, "working");
  h.settings.stop();
});

for (const scenario of [{ output: "" }, { failure: true }, { latestTitle: "用户已改名" }]) {
  test(`failed or superseded generation preserves the source title and cleans up: ${JSON.stringify(scenario)}`, async () => {
    const h = generationHarness(scenario);
    await h.settings.refresh();
    h.releaseCompaction();
    const result = await h.generate();
    assert.equal(result.status, scenario.latestTitle ? "title-changed" : "error");
    assert.equal(h.calls.some(c => c.method === "thread/name/set"), false);
    assert.equal(h.calls.at(-1).method, "discard");
    assert.equal(h.calls.at(-1).threadId, "working");
    h.settings.stop();
  });
}
