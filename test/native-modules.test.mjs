import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const source = await readFile(new URL('../scripts/better-ui-imropvement.js', import.meta.url), 'utf8');
test('native service discovery follows both initial and shared entry modules', async () => {
  const script = {src:'app://-/assets/index-new.js'};
  const functions = source.slice(source.indexOf('  function localModuleUrl('), source.indexOf('  function resolverFromModule('));
  const context = vm.createContext({ URL, document:{baseURI:'app://-/index.html',querySelectorAll:()=>[script]}, performance:{getEntriesByType:()=>[]},
    fetch:async()=>({ok:true,text:async()=>'import "./app-shared-new.js"; import "./app-initial-new.js";'}) });
  vm.runInContext(functions, context);
  assert.deepEqual(Array.from(await context.discoverAppInitialUrls()).sort(), ['app://-/assets/app-initial-new.js','app://-/assets/app-shared-new.js']);
});
test('thread menu discovery reaches the expanded native sidebar hook list', () => {
  const ref = {current:()=> 'native-menu'};
  let hook = {memoizedState:ref,next:null};
  for (let i=0;i<172;i++) hook = {memoizedState:null,next:hook};
  const functions=source.slice(source.indexOf('  function threadMenuRefFor('),source.indexOf('  function restoreMenuRef('));
  const context=vm.createContext({reactFiberFor:()=>({memoizedState:hook}),isThreadMenuFactorySource:s=>s.includes('native-menu')});
  vm.runInContext(functions,context);
  assert.equal(context.threadMenuRefFor({}),ref);
});
test('project color menu discovery crosses the new dropdown wrappers', () => {
  const handle={getContextMenuItems:()=>[]};
  let fiber={memoizedProps:{ref:{current:handle}},return:null};
  for(let i=0;i<23;i++) fiber={memoizedProps:{},return:fiber};
  const context=vm.createContext({reactFiberFor:()=>fiber});
  vm.runInContext(source.slice(source.indexOf('    const projectActionsHandleFor ='),source.indexOf('    const nativeMenuMessage ='))+'\nglobalThis.findHandle=projectActionsHandleFor;',context);
  assert.equal(context.findHandle({querySelector:()=>({})}),handle);
});
test('split navigation uses one rail control before profile utilities without a list footer', () => {
  let slot=null, visible=true;
  const profile={};
  const utilities={contains:node=>node===profile};
  const navigation={children:[utilities],querySelector:selector=>selector.startsWith(':scope')?slot:profile,insertBefore:(node,before)=>{assert.equal(before,utilities);slot=node}};
  const context=vm.createContext({document:{querySelector:()=>navigation,createElement:()=>({dataset:{}})},
    isVisibleElement:()=>visible,findUsageSidebar:()=>null});
  vm.runInContext(source.slice(source.indexOf('    const findSidebarSlot ='),source.indexOf('    const displaySnapshot ='))+'\nglobalThis.findSlot=findSidebarSlot;',context);
  assert.equal(context.findSlot().dataset.codexppUsageSlot,'navigation-rail');
  assert.equal(context.findSlot(),slot);
  visible=false;
  assert.equal(context.findSlot(),null);
});
test('compact usage hover shows reset day and time instead of the remaining percentage', () => {
  const left={},right={};
  const context=vm.createContext({compact:true,zh:true,kind:'weekly',left,isApiSnapshot:()=>false,
    applyValueState:()=>{left.textContent='每周';right.textContent='40%';},entryFor:s=>s.weekly,
    setText:(node,text)=>{node.textContent=text;},setClass:()=>{},singleRightSpan:()=>right});
  vm.runInContext(source.slice(source.indexOf('  const applyHoverState = (snap) => {'),source.indexOf('  // Bind hover with a snapshot getter'))+'\nglobalThis.hover=applyHoverState;',context);
  context.hover({weekly:{resetAt:'周四16:49'}});
  assert.equal(left.textContent,'周四');
  assert.equal(right.textContent,'16:49');
  context.hover({weekly:{resetAt:'Thu, 4:49 PM'}});
  assert.equal(left.textContent,'Thu PM');
  assert.equal(right.textContent,'4:49');
  context.hover({weekly:{resetAt:null}});
  assert.equal(left.textContent,'重置');
  assert.equal(right.textContent,'—');
});
