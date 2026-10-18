import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../scripts/better-ui-imropvement.js', import.meta.url), 'utf8');
const feature = name => source.slice(source.indexOf(`  "${name}"(`));
const fn = (body, name) => body.match(new RegExp(`    const ${name} = \\([\\s\\S]*?\\n    \\};`, 'u'))[0];

test('legacy project colors do not depend on visibility or modality', () => {
  class Element {
    classList = {contains: value => value === 'group/cwd'};
    getAttribute(name) { return name === 'role' ? 'listitem' : 'Project'; }
    querySelector() { return this; }
  }
  const eligible = vm.runInNewContext(`${fn(feature('sidebar-project-backgrounds'), 'isProjectRow')}\nisProjectRow`, {
    HTMLElement: Element, nativeProjectRowFor: () => null, labelFor: () => 'project', EXCLUDED_LABELS: new Set(),
    visible: () => { throw new Error('a modal must not invalidate project identity'); },
  });
  assert.equal(eligible(new Element()), true);
});

test('conversation colors survive a modal, avoid unchanged writes, and still support none', () => {
  let writes = 0, cleared = 0, color = 'blue';
  class Element {
    attributes = {};
    values = {};
    style = {getPropertyValue: key => this.values[key] || '', setProperty: (key, value) => {writes++;this.values[key] = value;}};
    getAttribute(key) { return this.attributes[key]; }
    setAttribute(key, value) {writes++;this.attributes[key] = value;}
  }
  const thread = new Element();
  const sidebar = {querySelectorAll: () => [thread]};
  const apply = vm.runInNewContext(`let activeSidebar;\n${fn(feature('sidebar-conversation-colors'), 'apply')}\napply`, {
    HTMLElement: Element, disposed: false, mainSidebar: () => sidebar, projectIndex: () => ({}),
    THREAD_SELECTOR: 'thread', ATTR: 'color', projectForThread: () => ({id: 'project'}),
    storedColorFor: () => color, paletteFor: () => ({value: 'blue'}), clearRow: () => {cleared++;},
    visible: () => { throw new Error('color must not depend on an overlay'); },
  });
  apply();
  const firstWrites = writes;
  assert.equal(firstWrites, 2);
  apply();
  assert.equal(writes, firstWrites);
  color = 'none';
  apply();
  assert.ok(cleared > 0);
});

test('mutation scope detects additions, removals and text inside a feature, not chat churn', () => {
  const body = source.match(/function mutationsAffect\(records, selector\) \{[\s\S]*?\n\}/u)?.[0];
  assert.ok(body, 'features share a scoped mutation check');
  class Element {
    constructor(name, children = []) {this.name=name;this.children=children;for(const child of children)child.parentElement=this;}
    matches(selector) {return this.name===selector;}
    closest(selector) {return this.matches(selector) ? this : this.parentElement?.closest(selector) || null;}
    querySelector(selector) {return this.children.find(c=>c.matches(selector)) || this.children.map(c=>c.querySelector(selector)).find(Boolean) || null;}
  }
  const affects = vm.runInNewContext(`${body}\nmutationsAffect`, {Element});
  const inner = new Element('inner'), feature = new Element('feature',[inner]);
  const chat = new Element('chat'), root = new Element('root',[feature,chat]);
  const record = (target, addedNodes=[], removedNodes=[]) => ({target,addedNodes,removedNodes});
  assert.equal(affects([record(chat,[{parentElement:chat}])], 'feature'), false);
  assert.equal(affects([record(inner)], 'feature'), true);
  assert.equal(affects([record({parentElement:inner})], 'feature'), true);
  assert.equal(affects([record(root,[new Element('wrapper',[new Element('feature')])])], 'feature'), true);
  assert.equal(affects([record(root,[],[feature])], 'feature'), true);
});

test('continuous thread updates cannot postpone the native menu patch forever', () => {
  const body = source.slice(source.indexOf('  function schedulePatch('),source.indexOf('  function scopeFromRow('));
  const callbacks = new Map();let id=0, patched=0;
  const schedule = vm.runInNewContext(`let scanTimer=0;${body}\nschedulePatch`, {
    enabledActions: new Set(['export']), patchMenus: () => patched++,
    window: {setTimeout: cb=>{callbacks.set(++id,cb);return id;},clearTimeout: key=>callbacks.delete(key)},
  });
  schedule();const first=[...callbacks.keys()][0];
  for(let i=0;i<30;i++)schedule();
  assert.equal(callbacks.size,1);
  assert.ok(callbacks.has(first));
  callbacks.get(first)();assert.equal(patched,1);
});

for (const [name, selector] of [
  ['render-markdown-preview-math','data-editor-search-surface'],
  ['slash-menu-polish','data-composer-overlay-floating-ui'],
  ['hide-usage-alert','webview'],
]) {
  test(`${name} only schedules for relevant mutations`, () => {
    const body = feature(name).match(/^    (?:const )?observer = new MutationObserver\([\s\S]*?^    \}\);/mu)?.[0];
    assert.ok(body);
    let callback, scans=0;
    vm.runInNewContext(`let observer;\n${body.replace('const observer =', 'observer =')}`, {
      MutationObserver: class {constructor(fn){callback=fn;}},
      mutationsAffect: (records,scope) => {assert.ok(scope.includes(selector));return records.some(r=>r.relevant);},
      scheduleScan: ()=>scans++, scheduleSlashWork: ()=>scans++, schedule: ()=>scans++,
      NAV_NOISE_SELECTOR: 'nav-noise', quotaSurfaceSelector: '[role=alert]',
    });
    callback([{relevant:false}]);assert.equal(scans,0);
    callback([{relevant:true}]);assert.equal(scans,1);
  });
}

test('hover scroll protection coalesces pointer events into one frame without timer bursts', () => {
  const body=feature('slash-menu-polish');
  class Element {scrollTop=100;isConnected=true;}
  const scroller=new Element();
  const state={freezeTop:100,lastTop:100,freezeUntil:0,restoreFrame:0,programmaticTarget:null,programmaticUntil:0};
  let frames=0,timers=0;
  const queue=body.includes('    const queueHoverScrollFreezeChecks =') ? fn(body,'queueHoverScrollFreezeChecks') : '';
  const freeze=vm.runInNewContext(`${fn(body,'requestHoverScrollFreezeFrame')}\n${queue}\n${fn(body,'freezeHoverScroll')}\nfreezeHoverScroll`, {
    HTMLElement:Element, disposed:false, performance:{now:()=>10}, hoverScrollStateFor:()=>state,
    requestAnimationFrame:()=>++frames, enforceHoverScrollFreeze:()=>{},
    window:{setTimeout:()=>++timers},
  });
  for(let i=0;i<40;i++)freeze({querySelector:()=>scroller});
  assert.equal(frames,1);
  assert.equal(timers,0,'the existing frame loop already enforces the scroll guard');
});

test('closed slash scrollers release every listener, animation and cached section', () => {
  class Element {removeEventListener(...args){removed.push(args);}}
  const removed=[], cancelled=[];
  const scroller=new Element(), handler=()=>{};
  const maps=Object.fromEntries(['scrollHandlers','pointerHandlers','wheelHandlers','hoverGuardHandlers'].map(key=>[key,new Map([[scroller,handler]])]));
  const scrollAnimations=new Map([[scroller,{}]]);
  const hoverScrollStates=new WeakMap([[scroller,{restoreFrame:7}]]);
  const sectionCache=new WeakMap([[scroller,[]]]);
  const cleanup=vm.runInNewContext(`${fn(feature('slash-menu-polish'),'cleanupScroller')}\ncleanupScroller`, {
    HTMLElement:Element,...maps,scrollAnimations,hoverScrollStates,sectionCache,
    HOVER_GUARD_EVENTS:['pointerover','mouseover'],
    cancelScrollAnimation:node=>scrollAnimations.delete(node),cancelAnimationFrame:id=>cancelled.push(id),
  });
  cleanup(scroller);
  assert.ok(Object.values(maps).every(map=>map.size===0));
  assert.equal(scrollAnimations.size,0);
  assert.equal(hoverScrollStates.has(scroller),false);
  assert.equal(sectionCache.has(scroller),false);
  assert.deepEqual(cancelled,[7]);
  assert.deepEqual(removed.map(args=>args[0]),['scroll','pointermove','pointerdown','wheel','pointerover','mouseover']);
  assert.ok(removed.slice(-2).every(args=>args[2]===true));
  cleanup(scroller);
  assert.equal(removed.length,6);
});

test('native thread menu observer ignores chat churn but handles identity removal', () => {
  const body=source.slice(source.indexOf('  function start() {')).match(/^    observer = new MutationObserver\([\s\S]*?^    \}\);/mu)[0];
  let callback, scans=0;
  vm.runInNewContext(`let observer;\n${body}`, {
    MutationObserver:class {constructor(fn){callback=fn;}},THREAD_SELECTOR:'thread',
    mutationsAffect:records=>records.some(record=>record.relevant),schedulePatch:()=>scans++,
  });
  callback([{type:'childList',relevant:false}]);assert.equal(scans,0);
  callback([{type:'childList',relevant:true}]);assert.equal(scans,1);
  callback([{type:'attributes',relevant:false}]);assert.equal(scans,2);
});

test('upgrade prompt scans are not postponed by a continuous stream of added nodes', () => {
  class Element {}
  const root=new Element(), callbacks=new Map();let id=0;
  const schedule=vm.runInNewContext(`let scanTimer=0;const pendingRoots=new Set();\n${fn(feature('hide-upgrade-prompts'),'scheduleRoots')}\nscheduleRoots`, {
    Element, document:{documentElement:{}},flushPendingRoots:()=>{},
    window:{setTimeout:fn=>{callbacks.set(++id,fn);return id;},clearTimeout:id=>callbacks.delete(id)},
  });
  schedule([{addedNodes:[root]}]);const first=[...callbacks.keys()][0];
  for(let i=0;i<20;i++)schedule([{addedNodes:[root]}]);
  assert.equal(callbacks.size,1);
  assert.ok(callbacks.has(first));
});
