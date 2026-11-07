// Usage: node tools/check-theme-toggle-live.mjs <managed-loopback-port>
// Exercises the installed button and restores the previous native preference (including system).
import assert from 'node:assert/strict';
const port=Number(process.argv[2]);
if (!Number.isInteger(port)||port<1||port>65535) throw Error('Supply the managed Codex port');
const targets=await fetch(`http://127.0.0.1:${port}/json/list`,{redirect:'error',signal:AbortSignal.timeout(5000)}).then(r=>r.json());
const pages=targets.filter(t=>t.type==='page'&&t.url==='app://-/index.html');
assert.equal(pages.length,1,'Expected one managed main page');
const url=new URL(pages[0].webSocketDebuggerUrl);
assert.equal(url.origin,`ws://127.0.0.1:${port}`);
const socket=new WebSocket(url);
try {
 await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject;});
 const run=async()=>{
   const key='appearanceTheme', root=document.documentElement;
   const buttons=document.querySelectorAll('[data-codexpp="app-theme-toggle"]');
   if(buttons.length!==1)throw Error('Expected exactly one installed theme button');
   const button=buttons[0];
   if (!button || !globalThis.__codexScriptLoaderHostBridge?.connected) throw Error('Theme button or managed bridge is absent');
   let settings;
   for(const script of document.querySelectorAll('script[type="module"][src]')){
     if(!script.src.startsWith('app://-/assets/'))continue;
     const cache=(await import(script.src)).__webpack_require__?.c;
     if(!cache)continue;
     const entry=Object.values(cache).find(m=>Object.hasOwn(m.exports??{},'appServices')&&m.exports.appServices?.settings);
     if(entry){settings=entry.exports.appServices.settings;break;}
   }
   if(!settings)throw Error('No native settings service');
   const original=await settings.read(key), start=root.dataset.theme;
   if(!['light','dark'].includes(start))throw Error('Unknown rendered theme');
   const receipt=[];
   const wait=()=>new Promise(r=>setTimeout(r,60));
   try {
     for(const wanted of [start==='dark'?'light':'dark',start]){
       if (!button.isConnected) throw Error('Plugin instance changed during verification; wait for hot reload to settle');
       button.click();
       const deadline=Date.now()+5000;
       do {if(!button.disabled&&root.dataset.theme===wanted)break;await wait();}while(Date.now()<deadline);
       if (!button.isConnected) throw Error('Plugin instance changed during verification; wait for hot reload to settle');
       const stored=(await settings.read(key)).configured, rendered=root.dataset.theme, scheme=getComputedStyle(root).colorScheme;
       if(stored!==wanted||rendered!==wanted||scheme!==wanted)throw Error(`wanted=${wanted} stored=${stored} rendered=${rendered} scheme=${scheme} title=${button.title}`);
       receipt.push({stored,rendered,scheme});
     }
   }finally{
     if((await settings.read(key)).configured!==original.configured)await settings.write(key,original.configured);
     const end=Date.now()+3000;while(root.dataset.theme!==start&&Date.now()<end)await wait();
     if((await settings.read(key)).configured!==original.configured||root.dataset.theme!==start)throw Error('Failed to restore original appearance');
   }
   return {receipt,restored:original.configured??'unset'};
 };
 const result=await new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>reject(Error('Timed out waiting for live theme test')),25000);
  socket.onmessage=e=>{const m=JSON.parse(e.data);if(m.id===1){clearTimeout(timer);resolve(m);}};
  socket.send(JSON.stringify({id:1,method:'Runtime.evaluate',params:{expression:'('+run.toString()+')()',awaitPromise:true,returnByValue:true,userGesture:true}}));
 });
 if(result.error||result.result?.exceptionDetails)throw Error(result.error?.message??result.result.exceptionDetails.exception?.description??'Renderer exception');
 console.log(JSON.stringify(result.result.result.value));
}finally{socket.close();}
