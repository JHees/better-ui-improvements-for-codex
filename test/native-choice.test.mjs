import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const source=await readFile(new URL('../scripts/better-ui-imropvement.js',import.meta.url),'utf8');
const functions=source.slice(source.indexOf('  function nativeFactoryExport('),source.indexOf('  function reportLifecycle('));
const {nativeFactoryExport,nativeChoiceElement}=vm.runInNewContext(`${functions}\n({nativeFactoryExport,nativeChoiceElement})`,{Event});

test('native UI factories resolve through renamed export wrappers, not fixed bundle aliases',()=>{
 const bundle='var r$=q((e=>{e.createElement=function(){};})),reactWrap=q(((e,t)=>{t.exports=r$()})),client=q((e=>{e.createRoot=function(){};})),domWrap=q(((e,t)=>{function check(){}check(),t.exports=client()}));export{reactWrap as abc,domWrap as xyz};';
 assert.equal(nativeFactoryExport(bundle,'.createElement=function'),'abc');
 assert.equal(nativeFactoryExport(bundle,'.createRoot=function'),'xyz');
 assert.throws(()=>nativeFactoryExport('export{};','.createRoot=function'));
});

test('selection uses Codex Dropdown/RadioGroup/RadioItem and preserves existing change callbacks',()=>{
 const Dropdown=()=>{},RadioGroup=()=>{},RadioItem=()=>{};
 const runtime={Dropdown,Menu:{RadioGroup,RadioItem},React:{createElement:(type,props,...children)=>({type,props,children})}};
 const changes=[];
 const select={value:'one',disabled:false,options:[{value:'one',textContent:'First'},{value:'two',textContent:'Second'},{value:'blocked',textContent:'Unavailable',disabled:true}],getAttribute:()=> 'Theme',dispatchEvent:event=>changes.push({type:event.type,bubbles:event.bubbles,value:select.value})};
 let focused=false;const focus={beforeChange:()=>{focused=true},onMount:()=>{}};
 const tree=nativeChoiceElement(runtime,select,focus);
 assert.equal(tree.props.triggerButton.props.ref,focus.onMount);
 assert.equal(tree.type,Dropdown);
 assert.equal(tree.props.triggerButton.props['aria-label'],'Theme');
 const group=tree.children[0];assert.equal(group.type,RadioGroup);
 assert.ok(group.children[0].every(item=>item.type===RadioItem));
 group.props.onValueChange('two');assert.equal(focused,true);
 assert.deepEqual(changes,[{type:'change',bubbles:true,value:'two'}]);
 group.props.onValueChange('blocked');group.props.onValueChange('unknown');select.disabled=true;group.props.onValueChange('one');
 assert.equal(changes.length,1);
});

test('native roots and their portaled menus unmount with their settings container',()=>{
 const cleanup=source.slice(source.indexOf('  function unmountNativeChoices('),source.indexOf('  function mountNativeChoices('));
 const one={},two={},events=[];
 const nativeChoiceRoots=new Map([one,two].map((select,i)=>[select,{root:{unmount:()=>events.push(`unmount ${i}`)},host:{remove:()=>events.push(`remove ${i}`)}}]));
 const unmount=vm.runInNewContext(`${cleanup}\nunmountNativeChoices`,{nativeChoiceRoots});
 unmount({contains:select=>select===one});
 assert.equal(nativeChoiceRoots.size,1);assert.deepEqual(events,['unmount 0','remove 0']);
 unmount();assert.equal(nativeChoiceRoots.size,0);assert.deepEqual(events,['unmount 0','remove 0','unmount 1','remove 1']);
});
