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
