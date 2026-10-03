import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const source=await readFile(new URL('../scripts/better-ui-imropvement.js',import.meta.url),'utf8');
const model=source.slice(source.indexOf('  const PROJECT_THEME_STORAGE_KEY'),source.indexOf('  function reportLifecycle('));
const {createProjectTheme,validateProjectTheme,projectThemeVariables,projectThemePalette}=vm.runInNewContext(`${model}\n({createProjectTheme,validateProjectTheme,projectThemeVariables,projectThemePalette})`);

test('all three presets round-trip both palettes and independent custom edits',()=>{
 for(const id of ['codex','github','vscode']){
  const preset=createProjectTheme(id);
  const roundtrip=validateProjectTheme(JSON.parse(JSON.stringify(preset)));
  assert.equal(JSON.stringify(roundtrip),JSON.stringify(preset));
  for(const mode of ['light','dark']) assert.equal(Object.keys(roundtrip.variants[mode].colors).length,7);
  roundtrip.variants.dark.colors.blue.text='#abcdef';
  assert.notEqual(createProjectTheme(id).variants.dark.colors.blue.text,'#abcdef');
  const css=projectThemeVariables(roundtrip);
  assert.ok(css.includes('#abcdef'));
  assert.ok(css.includes('--bui-theme-radius:'));
 }
 const custom=createProjectTheme('github'); custom.mode='light';custom.styles.radius=0;custom.styles.borderWidth=0;custom.styles.stripeWidth=0;
 assert.equal(validateProjectTheme(custom).styles.radius,0);
 assert.match(projectThemeVariables(custom),/--bui-theme-scheme:light/);
 assert.equal(projectThemePalette().length,7);
});

test('theme import rejects incomplete, executable and out-of-range values without changing the saved object',()=>{
 const saved=JSON.stringify(createProjectTheme());
 const mutations=[v=>v.schemaVersion=2,v=>v.mode='system',v=>v.name='',v=>v.styles.radius=-1,v=>v.styles.borderWidth=4,v=>v.styles.radius=.5,v=>v.styles.hoverOpacity='20',v=>v.styles.stripeWidth=NaN,v=>delete v.variants.dark,v=>v.variants.light.colors.blue.text='red; } body { display:none',v=>delete v.variants.dark.colors.gray,v=>v.variants.light.surface='url(https://example.test)'];
 for(const mutate of mutations){const candidate=JSON.parse(saved);mutate(candidate);assert.throws(()=>validateProjectTheme(candidate));}
 assert.throws(()=>validateProjectTheme(null));
 assert.equal(JSON.stringify(createProjectTheme()),saved);
 const dirty=JSON.parse(saved);dirty.variants.light.colors.blue.extra='ignored';dirty.extra='<script>';
 assert.equal(JSON.stringify(validateProjectTheme(dirty)),saved);
});

test('theme values only define plugin-owned colors and geometry',()=>{
 for(const preset of ['codex','github','vscode']){
  for(const mode of ['auto','light','dark']){
   const theme=createProjectTheme(preset);theme.mode=mode;
   const declarations=projectThemeVariables(theme).split(';');
   for(const declaration of declarations)assert.match(declaration,/^--(?:codexpp-project-|bui-theme-)[\w-]+:/);
   assert.doesNotMatch(declarations.join(';'),/[{}]|--color-|--font-|--codex-base/);
  }
 }
});
