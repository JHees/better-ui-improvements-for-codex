import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../scripts/better-ui-imropvement.js', import.meta.url), 'utf8');
const extract = (start, end) => source.slice(source.indexOf(start), source.indexOf(end));

test('delete menu reuses an existing native item and closes before opening the dialog', () => {
  const selected = [];
  const context = {};
  const append = vm.runInNewContext(`${extract('  function appendThreadActions(', '  function patchMenus(')};appendThreadActions`, {
    REGENERATE_ITEM_ID: 'regenerate', EXPORT_ITEM_ID: 'export', DELETE_SEPARATOR_ID: 'separator', DELETE_ITEM_ID: 'plugin-delete',
    SESSION_ACTION_REGENERATE_TITLE: 'regenerate', SESSION_ACTION_EXPORT: 'export', SESSION_ACTION_DELETE: 'delete',
    inFlight: new Set(),
    enabledActions: new Set(['delete']), labels: () => ({delete: 'Delete permanently'}),
    nativeMessage: (id, defaultMessage) => ({id, defaultMessage}), svgIcon: () => 'icon',
    DELETE_ICON_PATH: '', systemDangerColor: () => 'red', openNativeDeleteDialog: value => selected.push(value),
  });
  const native = {id: 'delete-thread', onSelect() {}, selectAfterClose: true};
  const nativeCallback = native.onSelect;
  const existing = append([{id: 'archive-thread'}, native], context);
  assert.equal(existing.length, 2);
  assert.equal(existing[1].id, native.id);
  assert.equal(existing[1].selectAfterClose, true);
  assert.equal(native.onSelect, nativeCallback, 'the native source item is not mutated');
  assert.equal(append([{...native, enabled: false}], context)[0].enabled, false);
  existing[1].onSelect();
  const item = append([{id: 'archive-thread'}], context).at(-1);
  assert.equal(item.selectAfterClose, true);
  item.onSelect();
  assert.deepEqual(selected, [context, context]);
});

test('native delete discovery follows renamed exports and the bundled dialog path', () => {
  const discover = vm.runInNewContext(`${extract('  function nativeDeleteRuntimeFromModules(', '  async function loadNativeDeleteRuntime(')};nativeDeleteRuntimeFromModules`);
  function modal(scope, component, props, options) {
    return scope.set('dialogs', state => ({modals: state.modals.find(item => item.ModalComponent === component), ModalComponent: component, props, blocksOtherModals: options?.blocksOtherModals}));
  }
  function menu() { return {id: 'delete-thread', onSelect: () => import('./delete-thread-dialog-new.js').then(m => m.DeleteThreadDialog)}; }
  const runtime = discover([{renamed: modal}, {alsoRenamed: menu}]);
  assert.equal(runtime.openModal, modal);
  assert.equal(runtime.dialogPath, './delete-thread-dialog-new.js');
  assert.equal(discover([{unrelated: () => 'DeleteThreadDialog'}]), null);
});

test('delete opens the native confirmation with the exact target and never sends a delete request itself', async () => {
  const calls = [], errors = [];
  const scope = {}, row = {}, component = () => null;
  const context = {row, hostId: 'local', threadId: 'target-id', threadKey: 'local:target-id'};
  const globals = {
    SESSION_ACTION_DELETE: 'delete', inFlight: new Set(), operationEpoch: 0,
    scopeFromRow: () => scope,
    loadNativeDeleteRuntime: async () => ({openModal: (...args) => calls.push(args), DeleteThreadDialog: component, React: {createElement: (type, props, child) => ({type, props, child})}}),
    labels: () => ({unavailable: 'unavailable'}), log() {}, showToast: message => errors.push(message),
  };
  const sandbox = vm.createContext(globals);
  vm.runInContext(extract('  function backgroundDeleteConfirmation(', '  async function loadNativeDeleteRuntime('), sandbox);
  vm.runInContext(extract('  async function openNativeDeleteDialog(', '  function start()'), sandbox);
  await sandbox.openNativeDeleteDialog(context);
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], scope);
  assert.equal(calls[0][1]({}).child.type, component);
  assert.deepEqual({...calls[0][2]}, {conversationId: 'target-id', hostId: 'local', returnFocusTo: row});
  assert.equal(globals.inFlight.size, 0);
  sandbox.loadNativeDeleteRuntime = async () => { throw new Error('native unavailable'); };
  await sandbox.openNativeDeleteDialog(context);
  assert.deepEqual(errors, ['native unavailable']);
  assert.equal(calls.length, 1);
  sandbox.loadNativeDeleteRuntime = async () => { sandbox.operationEpoch++; return {openModal: (...args) => calls.push(args), DeleteThreadDialog: component}; };
  await sandbox.openNativeDeleteDialog(context);
  assert.equal(calls.length, 1, 'a stopped plugin must not open a delayed dialog');
});

test('native confirmation closes before a slow deletion and intercepts mouse or keyboard form submission only once', () => {
  const events = [];
  const React = {createElement: (type, props, child) => ({type, props, child})};
  const NativeDialog = () => {};
  const make = vm.runInNewContext(`${extract('  function backgroundDeleteConfirmation(', '  async function loadNativeDeleteRuntime(')};backgroundDeleteConfirmation`);
  const Confirm = make(React, NativeDialog, () => events.push('request'));
  const props = {onClose: () => events.push('close'), conversationId: 'test-id'};
  const tree = Confirm(props);
  assert.equal(tree.child.type, NativeDialog);
  assert.equal(tree.child.props, props);
  const submit = {preventDefault: () => events.push('prevent'), stopPropagation: () => events.push('stop')};
  tree.props.onSubmitCapture(submit);
  tree.props.onSubmitCapture(submit);
  assert.deepEqual(events, ['prevent', 'stop', 'close', 'request', 'prevent', 'stop']);
});

test('background deletion stays pending until the native request settles and reports success or failure accurately', async () => {
  for (const failed of [false, true]) {
    let resolve, reject, started;
    const pending = new Promise((ok, error) => {resolve = ok; reject = error;});
    const called = new Promise(ok => {started = ok;});
    const updates = [], requests = [], progress = [];
    const scope = {}, context = {threadId: 'test-id', hostId: 'local', threadKey: 'local:test-id', title: 'Test'};
    const sandbox = vm.createContext({
      SESSION_ACTION_DELETE: 'delete', operationEpoch: 1, inFlight: new Set(),
      labels: () => ({deleting: 'Deleting {title}', deleted: 'Deleted', deleteFailed: 'Delete failed: {error}'}),
      showTitleProgress: async message => {progress.push(message); return {update: (...args) => updates.push(args)};},
      nativeClientFor: async (target, capturedScope) => {assert.equal(target, context); assert.equal(capturedScope, scope); return {sendRequest: (method, payload) => {requests.push([method, {...payload}]); started(); return pending;}};},
      showToast() {throw new Error('Unexpected fallback toast');}, log() {},
    });
    vm.runInContext(extract('  async function deleteThreadInBackground(', '  function start()'), sandbox);
    const operation = sandbox.deleteThreadInBackground(context, scope, 1);
    await called;
    assert.deepEqual(progress, ['Deleting Test']);
    assert.equal(updates.length, 0, 'pending requests must not be reported as successful');
    assert.equal(sandbox.inFlight.size, 1);
    await sandbox.deleteThreadInBackground(context, scope, 1);
    assert.deepEqual(requests, [['thread/delete', {threadId: 'test-id'}]]);
    if (failed) reject(new Error('backend failure')); else resolve({});
    await operation;
    assert.deepEqual(updates, [[failed ? 'Delete failed: backend failure' : 'Deleted', failed ? 'error' : 'success', failed ? 8000 : 3800]]);
    assert.equal(sandbox.inFlight.size, 0);
    await sandbox.deleteThreadInBackground(context, scope, 0);
    assert.equal(requests.length, 1, 'a stopped confirmation must not start deletion');
  }
});
