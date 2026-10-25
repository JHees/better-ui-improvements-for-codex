import assert from 'node:assert/strict';

const port = Number(process.argv[2]);
assert.ok(Number.isInteger(port) && port > 0 && port <= 65535, 'Pass the verified Loader CDP port');
const response = await fetch(`http://127.0.0.1:${port}/json/list`, {signal: AbortSignal.timeout(5000)});
assert.ok(response.ok, `CDP discovery failed: ${response.status}`);
const target = (await response.json()).find(item => item.type === 'page' && item.url === 'app://-/index.html');
assert.ok(target, 'Managed renderer unavailable');
const endpoint = new URL(target.webSocketDebuggerUrl);
assert.equal(endpoint.protocol, 'ws:');
assert.equal(endpoint.hostname, '127.0.0.1');
assert.equal(Number(endpoint.port), port);
const socket = new WebSocket(endpoint);
const timeout = setTimeout(() => socket.close(), 15000);
try {
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, {once: true});
    socket.addEventListener('error', reject, {once: true});
  });
  const expression = `(${inspectThreadMenus.toString()})()`;
  const result = await new Promise((resolve, reject) => {
    socket.addEventListener('message', event => {
      const message = JSON.parse(event.data);
      if (message.id !== 1) return;
      if (message.error) reject(new Error(message.error.message)); else resolve(message.result);
    });
    socket.addEventListener('close', () => reject(new Error('CDP closed before probe completed')), {once: true});
    socket.send(JSON.stringify({id: 1, method: 'Runtime.evaluate', params: {expression, awaitPromise: true, returnByValue: true}}));
  });
  assert.ok(!result.exceptionDetails, result.exceptionDetails?.exception?.description || result.exceptionDetails?.text);
  const report = result.result.value;
  console.log(JSON.stringify(report, null, 2));
  assert.equal(report.status, 'running');
  for (const path of ['contextMenu', 'rowActions']) {
    assert.ok(report[path], `${path} factory unavailable`);
    for (const id of ['regenerate-title', 'export-markdown', 'delete-permanently']) {
      const matches = report[path].filter(item => item.id === 'better-ui-imropvement-thread-' + id);
      assert.equal(matches.length, 1, `${path}: ${id} missing or duplicated`);
      assert.equal(matches[0].selectable, true, `${path}: ${id} has no selection callback`);
    }
  }
} finally {
  clearTimeout(timeout);
  socket.close();
}

async function inspectThreadMenus() {
  const row = [...document.querySelectorAll('[data-app-action-sidebar-thread-row]')]
    .find(node => node.getAttribute('data-app-action-sidebar-thread-host-id') === 'local' &&
      node.getAttribute('data-app-action-sidebar-thread-kind') === 'local' && node.getClientRects().length);
  if (!row) throw new Error('Visible local thread row unavailable');
  const action = row.querySelector('button[aria-haspopup="menu"]');
  const factoryFor = (node, trigger) => {
    const key = node && Object.getOwnPropertyNames(node).find(name => name.startsWith('__reactFiber$'));
    for (let fiber = key && node[key], depth = 0; fiber && depth < 40; fiber = fiber.return, depth++) {
      const props = fiber.memoizedProps;
      if (typeof props?.getItems === 'function' && (props.trigger || 'contextmenu') === trigger &&
          ('awaitBeforeOpen' in props || 'preserveBrowserContextMenu' in props)) return props.getItems;
    }
    return null;
  };
  const contextMenu = factoryFor(row, 'contextmenu');
  const rowActions = factoryFor(action, 'click');
  const summarize = items => items.map(item => ({
    id: item.id, label: item.message?.defaultMessage || item.label || '', selectable: typeof item.onSelect === 'function',
  }));
  return {
    version: globalThis.__betterUiImropvement?.version,
    scriptLoadId: globalThis.__betterUiImropvement?.scriptLoadId,
    status: globalThis.__codexScriptLoader?.scripts?.['io.github.jhees.better-ui-imropvement']?.status,
    contextMenu: contextMenu ? summarize(await contextMenu()) : null,
    rowActions: rowActions ? summarize(await rowActions()) : null,
    diagnostics: globalThis.__betterUiImropvement?.threadActionsStatus?.().patchedMenuCount,
  };
}
