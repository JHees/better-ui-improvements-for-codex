import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../scripts/better-ui-imropvement.js', import.meta.url), 'utf8');
const extract = (start, end) => source.slice(source.indexOf(start), source.indexOf(end));

test('delete menu preserves an existing native action and closes before opening the dialog', () => {
  const selected = [];
  const context = {};
  const append = vm.runInNewContext(`${extract('  function appendThreadActions(', '  function patchMenus(')};appendThreadActions`, {
    REGENERATE_ITEM_ID: 'regenerate', EXPORT_ITEM_ID: 'export', DELETE_SEPARATOR_ID: 'separator', DELETE_ITEM_ID: 'plugin-delete',
    SESSION_ACTION_REGENERATE_TITLE: 'regenerate', SESSION_ACTION_EXPORT: 'export', SESSION_ACTION_DELETE: 'delete',
    enabledActions: new Set(['delete']), labels: () => ({delete: 'Delete permanently'}),
    nativeMessage: (id, defaultMessage) => ({id, defaultMessage}), svgIcon: () => 'icon',
    DELETE_ICON_PATH: '', systemDangerColor: () => 'red', openNativeDeleteDialog: value => selected.push(value),
  });
  const native = {id: 'delete-thread', onSelect() {}, selectAfterClose: true};
  const existing = append([{id: 'archive-thread'}, native], context);
  assert.equal(existing.length, 2);
  assert.equal(existing[1], native);
  const item = append([{id: 'archive-thread'}], context).at(-1);
  assert.equal(item.selectAfterClose, true);
  item.onSelect();
  assert.deepEqual(selected, [context]);
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
    loadNativeDeleteRuntime: async () => ({openModal: (...args) => calls.push(args), DeleteThreadDialog: component}),
    labels: () => ({unavailable: 'unavailable'}), log() {}, showToast: message => errors.push(message),
  };
  const sandbox = vm.createContext(globals);
  vm.runInContext(extract('  async function openNativeDeleteDialog(', '  function start()'), sandbox);
  await sandbox.openNativeDeleteDialog(context);
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], scope);
  assert.equal(calls[0][1], component);
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
