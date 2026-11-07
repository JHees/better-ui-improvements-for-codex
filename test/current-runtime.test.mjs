import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const source = await readFile(new URL('../scripts/better-ui-imropvement.js',import.meta.url),'utf8');
const helpers = source.slice(source.indexOf('async function currentAppRuntimes('),source.indexOf('function createTitleModelSettings(')).replace('import(url.href)','loadModule(url.href)');
test('current app runtime reads cached exports without legacy filenames or executing unrelated factories',async()=>{
 const exports={service:{}};let executed=0;const runtime=Object.assign(()=>{executed++;},{c:{renamed:{exports}},m:{}});
 const reads=[];
 const context=vm.createContext({URL,document:{baseURI:'app://-/index.html',querySelectorAll:()=>[{src:'https://external.test/app.js'},{src:'app://-/assets/123.hash.js'}]},loadModule:async url=>{reads.push(url);return {renamedRuntime:runtime}}});
 vm.runInContext(helpers,context);
 assert.equal((await context.currentAppModules())[0],exports);assert.equal(executed,0);assert.deepEqual(reads,['app://-/assets/123.hash.js']);
});
test('native math resolves only the KaTeX factory and preserves errors',async()=>{
 const katex={render(){},renderToString(){}};const invoked=[];
 const runtime=Object.assign(id=>{invoked.push(id);return {default:katex};},{c:{},m:{other:()=>{},math:()=>{ /* renderToString ParseError */ }}});
 const context=vm.createContext({URL,document:{baseURI:'app://-/index.html',querySelectorAll:()=>[{src:'app://-/assets/123.hash.js'}]},loadModule:async()=>({__webpack_require__:runtime})});
 vm.runInContext(helpers,context);assert.equal(await context.currentNativeKatex(),katex);assert.deepEqual(invoked,['math']);
});

test('editor decoration discovery uses the active editor module and excludes another copy',async()=>{
 class ActiveView {} class OtherView {}
 const decoration={mark(){},replace(){},set(){}};
 const context=vm.createContext({codeMirrorPromise:null,currentAppModules:async()=>[
  {EditorView:OtherView,Decoration:{mark(){},replace(){},set(){}}},
  {EditorView:ActiveView,Decoration:decoration},
 ],currentMainModuleUrl:()=>{throw Error('cached active editor must not need filename discovery');}});
 vm.runInContext(source.slice(source.indexOf('    async function loadNativeCodeMirror('),source.indexOf('    async function discoverCodeMirrorRuntime(')),context);
 assert.equal(await context.loadNativeCodeMirror(new ActiveView()),decoration);
});
