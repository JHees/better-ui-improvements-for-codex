import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../scripts/better-ui-imropvement.js', import.meta.url), 'utf8');
const slotSource = source.slice(source.indexOf('    const findSidebarSlot ='), source.indexOf('    return findSidebarSlot;'));

test('modern startup waits for its rail and never probes legacy placement', () => {
  let navigation = null, visible = false, slot = null;
  const profile = {}, utilities = { contains: node => node === profile };
  const context = vm.createContext({ document: {
    querySelector: selector => selector.includes(' nav[') ? navigation : {},
    createElement: () => ({ dataset: {} }),
  }, isVisibleElement: () => visible, findUsageSidebar: () => { throw Error('Legacy placement used'); } });
  vm.runInContext(slotSource + '\nglobalThis.findSlot = findSidebarSlot;', context);
  assert.equal(context.findSlot(), null);
  navigation = { children: [utilities], querySelector: selector => selector.startsWith(':scope') ? slot : profile,
    insertBefore: (node, anchor) => { assert.equal(anchor, utilities); slot = node; } };
  assert.equal(context.findSlot(), null);
  visible = true;
  assert.equal(context.findSlot().dataset.codexppUsageSlot, 'navigation-rail');
  assert.equal(context.findSlot(), slot);
  visible = false;
  assert.equal(context.findSlot(), null);
});

test('legacy layout still uses a confirmed bottom toolbar without a floating placeholder', () => {
  class Element {}
  const control = new Element(), sidebar = new Element(), toolbar = new Element();
  sidebar.querySelectorAll = selector => selector.includes('usage-slot') ? [] : [control];
  const context = vm.createContext({ HTMLElement: Element, document: { querySelector: () => null },
    findUsageSidebar: () => sidebar, isValidUsageSlot: () => false, isVisibleElement: () => true,
    isNearSidebarBottom: () => true, isUsageControlNode: () => false, isSidebarContentRow: () => false,
    isProfileButton: () => true, nearestBottomToolbar: () => toolbar, createBottomToolbarSlot: row => row });
  vm.runInContext(slotSource + '\nglobalThis.findSlot = findSidebarSlot;', context);
  assert.equal(context.findSlot(), toolbar);
});

test('theme changes use native persisted settings with validation', async () => {
  const calls = [], setting = { key: 'appearanceTheme' }, scope = {};
  async function write(scope, setting, theme, options) {
    // Native discovery markers: .query.snapshot( configuredValues: optimistic
    calls.push({ scope, setting, theme, options });
  }
  const context = vm.createContext({ nativeScopeElement: () => ({}), scopeFromRow: () => scope,
    loadAppInitialModules: async () => [{ preferences: { theme: setting }, write }] });
  const method = source.slice(source.indexOf('    async setAppTheme('), source.indexOf('    async listTitleModels('));
  const actions = vm.runInContext('({' + method + '})', context);
  await actions.setAppTheme('dark');
  await actions.setAppTheme('light');
  assert.deepEqual(calls.map(call => call.theme), ['dark', 'light']);
  assert.ok(calls.every(call => call.scope === scope && call.setting === setting && call.options.optimistic === false));
  await assert.rejects(actions.setAppTheme('invalid'), /Invalid app theme/);
});

test('theme button is independent of usage, shares hover styling and cleans up', async () => {
  const observers = [], calls = [], warnings = [];
  class Element {
    dataset = {}; style = {}; attributes = {}; children = [];
    get firstChild() { return this.children[0] || null; }
    get isConnected() { return !!this.parentElement; }
    setAttribute(name, value) { this.attributes[name] = value; }
    appendChild(node) { this.insertBefore(node, null); }
    insertBefore(node, anchor) {
      node.remove(); node.parentElement = this;
      this.children.splice(anchor ? this.children.indexOf(anchor) : this.children.length, 0, node);
    }
    remove() { if (this.parentElement) this.parentElement.children = this.parentElement.children.filter(n => n !== this); this.parentElement = null; }
  }
  const root = new Element(), head = new Element();
  let slot = new Element(), pendingFrame = null;
  root.dataset.theme = 'light'; root.lang = 'zh-CN';
  const usage = new Element();
  let fail = false;
  const context = vm.createContext({ document: { documentElement: root, head,
    createElement: () => new Element() },
    findSidebarSlot: () => slot,
    window: { requestAnimationFrame: fn => { pendingFrame = fn; return 1; }, cancelAnimationFrame: () => { pendingFrame = null; } },
    MutationObserver: class { constructor(callback) { this.callback = callback; observers.push(this); } observe() {} disconnect() { this.stopped = true; } },
    sessionThreadActions: { async setAppTheme(theme) { calls.push(theme); if (fail) throw Error('offline'); root.dataset.theme = theme; } },
  });
  vm.runInContext(source.slice(source.indexOf('function styleSidebarControl('), source.indexOf('function renderUsageBox(')), context);
  const feature = source.slice(source.indexOf('  "app-theme-toggle"(api)'), source.indexOf('  "hide-usage-alert"()'));
  const start = vm.runInContext('({' + feature + '})["app-theme-toggle"]', context);
  const stop = start({ log: { warn: (...args) => warnings.push(args) } });
  const button = slot.children[0];
  assert.deepEqual(slot.children, [button], 'theme mounts with usage disabled');
  slot.appendChild(usage);
  observers[0].callback();
  assert.deepEqual(slot.children, [button, usage], 'enabling usage preserves theme first');
  usage.remove(); observers[0].callback();
  assert.deepEqual(slot.children, [button], 'disabling usage leaves theme mounted');
  assert.equal(button.attributes['aria-label'], '切换为深色外观');
  assert.match(button.className, /hover:bg-primary-ghost-hover/);
  assert.doesNotMatch(button.style.cssText, /background/);
  assert.match(button.style.cssText, /height:40px/);
  button.onmouseenter();
  assert.match(button.innerHTML, /切换.*深色/);
  await button.onclick(); observers[1].callback();
  assert.equal(button.attributes['aria-label'], '切换为浅色外观');
  assert.match(button.innerHTML, /切换.*浅色/);
  button.onmouseleave();
  assert.match(button.innerHTML, /^<svg/);
  await button.onclick(); observers[1].callback();
  assert.deepEqual(calls, ['dark', 'light']);
  fail = true;
  await button.onclick();
  assert.equal(button.disabled, false);
  assert.match(button.title, /切换失败/);
  assert.equal(warnings.length, 1);
  button.remove(); slot = new Element(); slot.appendChild(usage);
  observers[0].callback(); pendingFrame(); observers[0].callback();
  assert.deepEqual(slot.children, [button, usage]);
  stop();
  assert.equal(button.parentElement, null);
  assert.equal(head.children.length, 0);
  assert.deepEqual(slot.children, [usage], 'disabling theme preserves usage');
  assert.ok(observers.every(observer => observer.stopped));
  const stopAgain = start({ log: { warn() {} } });
  assert.equal(slot.children.length, 2);
  stopAgain();
  assert.deepEqual(slot.children, [usage]);
});
