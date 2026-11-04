import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../scripts/better-ui-imropvement.js', import.meta.url), 'utf8');
const discovery = source.slice(source.indexOf('    const nativeHttpClientModuleUrls ='), source.indexOf('    const resolveNativeHttpClientCandidates ='));

test('usage discovery follows the main entry when resource timing has been cleared', async () => {
  const entry = 'app://-/assets/index-current.js';
  const main = 'app://-/assets/app-main-current.js';
  const reads = [];
  const bodies = new Map([
    [entry, 'import "./app-shared-current.js"; import("./app-main-current.js");'],
    [main, 'import "./app-initial-current.js"; import "./app-primary-current.js";'],
  ]);
  class XMLHttpRequest {
    open(method, url) { assert.equal(method, 'GET'); this.url = url; }
    send() { reads.push(this.url); this.status = 200; this.responseText = bodies.get(this.url); this.onload(); }
  }
  const script = { src: entry };
  const context = vm.createContext({ URL, XMLHttpRequest,
    window: { location: { href: 'app://-/index.html' } },
    document: { querySelectorAll: selector => selector === 'script[src]' ? [script] : [script, { href: 'app://-/assets/app-shared-current.js' }] },
    performance: { getEntriesByType: () => [] },
    fetch: () => { throw Error('Codex replaces fetch'); },
  });
  vm.runInContext(discovery + '\nglobalThis.discover = nativeHttpClientModuleUrls;', context);
  const urls = Array.from(await context.discover());
  assert.ok(urls.includes('app://-/assets/app-initial-current.js'));
  assert.ok(urls.includes('app://-/assets/app-primary-current.js'));
  assert.deepEqual(reads, [entry, main]);
});

test('usage discovery survives renamed entry, runtime export and minified factories', async () => {
  const url = 'app://-/assets/renamed-entry.anyhash.mjs';
  const client = { safeGet: async () => ({ rate_limit: {} }), makeRequest() {} };
  const runtime = Object.assign(() => { throw Error('Must not execute modules'); }, {
    m: { renamed: () => {}, unrelated: () => {} },
    c: { renamed: { exports: { renamedExport: client, alias: client } }, unrelated: { get exports() { throw Error('Unrelated module inspected'); } } },
  });
  class XMLHttpRequest {
    open() {}
    send() { this.status = 200; this.responseText = ''; this.onload(); }
  }
  const context = vm.createContext({ URL, XMLHttpRequest,
    window: { location: { href: 'app://-/index.html' } },
    document: { querySelectorAll: () => [{ src: url }] },
    performance: { getEntriesByType: () => [] },
    importModule: async requested => { assert.equal(requested, url); return { renamedRuntime: runtime }; },
  });
  const resolver = source.slice(source.indexOf('    const nativeHttpClientModuleUrls ='), source.indexOf('    const fetchWithNativeHttpClient ='));
  vm.runInContext('let nativeHttpClientCandidatesPromise = null;\n' + resolver.replace('await import(moduleUrl)', 'await importModule(moduleUrl)') + '\nglobalThis.resolveClients = resolveNativeHttpClientCandidates;', context);
  assert.deepEqual(Array.from(await context.resolveClients()), [client]);
});

test('client capabilities accept prototype methods and isolate throwing exports and RPC proxies', () => {
  class Client {
    safeGet() {}
    makeRequest() {}
  }
  const client = new Client();
  const proxy = new Proxy({}, { get: () => () => { throw Error('RPC proxy called'); } });
  const mod = { proxy, get broken() { throw Error('Uninitialized export'); }, renamed: client, alias: client };
  const code = source.slice(source.indexOf('    const nativeHttpClientsFromModule ='), source.indexOf('    const resolveNativeHttpClientCandidates ='));
  const discover = vm.runInNewContext(code + '\nnativeHttpClientsFromModule');
  assert.deepEqual(Array.from(discover(mod)), [client]);
  const runtime = Object.assign(() => { throw Error('Factory executed'); }, { m: {}, c: { direct: { exports: client } } });
  assert.deepEqual(Array.from(discover({ runtime })), [client]);
});

test('failed clients are retried only after discovery refreshes the module cache', async () => {
  let calls = 0;
  const stale = { safeGet: async () => { calls++; throw Error('Old client'); } };
  const fresh = { safeGet: async () => 'fresh quota' };
  const context = vm.createContext({ stale, fresh });
  const code = source.slice(source.indexOf('    const fetchWithNativeHttpClient ='), source.indexOf('    const fetchCodexAppServerJson ='));
  vm.runInContext(`let nativeHttpClient = stale;
    let nativeHttpClientCandidatesPromise = Promise.resolve([stale]);
    const resolveNativeHttpClientCandidates = () => nativeHttpClientCandidatesPromise ||= Promise.resolve([fresh]);
    ${code}
    globalThis.requestUsage = fetchWithNativeHttpClient;`, context);
  await assert.rejects(context.requestUsage('/wham/usage'), /Old client/);
  assert.equal(calls, 1);
  assert.equal(await context.requestUsage('/wham/usage'), 'fresh quota');
});
