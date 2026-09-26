import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const source = await readFile(new URL("../scripts/better-ui-imropvement.js", import.meta.url), "utf8");
test("Markdown preview discovery uses the controller when the file header is hidden", () => {
  class Element {}
  const editor = new Element();
  const controller = { fileKind: "markdown", filePath: "report.md" };
  const context = vm.createContext({
    HTMLElement: Element,
    MARKDOWN_EXTENSION: /\.(?:md|markdown|mdown|mkd)$/i,
    document: { querySelectorAll: () => [{ querySelector: () => editor }] },
    markdownFileNameFor: () => "",
    findEditorController: () => controller,
  });
  vm.runInContext(source.slice(source.indexOf("    function findPreviewEditors("), source.indexOf("    function controllerFromValue(")), context);
  assert.equal(context.findPreviewEditors()[0], editor);
  controller.fileKind = "text";
  assert.equal(context.findPreviewEditors().length, 0, "source mode must stay untouched even for .md files");
  delete controller.fileKind;
  assert.equal(context.findPreviewEditors()[0], editor, "older controllers still work by file path");
});

test("native KaTeX discovery survives a cleared resource buffer and an index bootstrap", async () => {
  const context = vm.createContext({
    mainModuleUrl: null, URL,
    document: { scripts: [{ src: "app://-/assets/index-current.js" }], querySelectorAll: () => [] },
    performance: { getEntriesByType: () => [] },
    fetch: async url => ({ ok: true, text: async () => url.includes("index-")
      ? 'const dependencies=["./app-initial-current.js"]'
      : 'import(`./katex-current.js`)' }),
  });
  vm.runInContext(source.slice(source.indexOf("    async function currentMainModuleUrl("), source.indexOf("    function loadNativeKatex(")), context);
  assert.equal(await context.discoverKatexUrl(), "app://-/assets/katex-current.js");
});

test("native KaTeX discovery uses modulepreload after the renderer bundle splits", async () => {
  const context = vm.createContext({ document:{querySelectorAll:()=>[{href:'app://-/assets/katex-current.js'}]},
    performance:{getEntriesByType:()=>[]}, currentMainModuleUrl:()=>{throw Error('preloaded module should be used');} });
  vm.runInContext(source.slice(source.indexOf("    async function discoverKatexUrl("),source.indexOf("    function loadNativeKatex(")),context);
  assert.equal(await context.discoverKatexUrl(),'app://-/assets/katex-current.js');
});

const parserContext = vm.createContext({});
vm.runInContext(source.slice(source.indexOf("    function escapedAt("), source.indexOf("    function dispatchDesktopViewMessage(")), parserContext);
test("scientific inline and aligned display formulas retain their exact LaTeX", () => {
  const text = String.raw`设 $\mathbf{x}(n)$，$\hat{\mathbf{S}}_p$。
$$
\begin{aligned}
e_p(n)&=d_p(n)+(S_p*y)(n),\\
e_v(n)&=d_v(n)+(S_v*y)(n).
\end{aligned}
\tag{1}
$$`;
  const formulas = parserContext.parseMath(text);
  assert.equal(formulas.length, 3);
  assert.equal(formulas[0].content, String.raw`\mathbf{x}(n)`);
  assert.equal(formulas[2].display, true);
  assert.match(formulas[2].content, /\\tag\{1\}/);
});

test("code and currency do not become table formulas", () => {
  const formulas = parserContext.parseMath('| `$literal$` | $x^2$ | $20 USD | $30 USD |\n```tex\n$x$\n```');
  assert.equal(formulas.length, 1);
  assert.equal(formulas[0].content, "x^2");
});

test("inline replacements preserve native mark boundaries; display blocks replace whole lines", () => {
  const functionsSource = source.slice(source.indexOf("      function replacePreview("), source.indexOf("      function buildDecorations("));
  const context = vm.createContext({ Decoration: Object.fromEntries(["mark", "replace"].map(kind => [kind, spec => ({ range: (from, to) => ({ kind, spec, from, to }) })])) });
  vm.runInContext(functionsSource, context);
  const ranges = [], widget = {};
  context.replacePreview({ from: 10, to: 15, block: false }, widget, ranges);
  const replacement = ranges.find(range => range.kind === "replace");
  assert.equal(replacement.from, 11);
  assert.equal(replacement.to, 14);
  assert.equal(replacement.spec.widget, widget);
  assert.equal(ranges[0].from, 10);
  assert.equal(ranges[2].to, 15);
  assert.ok(ranges.filter(range => range.kind === "mark").every(range => range.spec.class === "better-ui-imropvement-preview-delimiter"));
  const blocks = [];
  context.replacePreview({ from: 0, to: 80, block: true }, widget, blocks);
  assert.equal(blocks.length, 1);
  assert.equal(blocks[0].from, 0);
  assert.equal(blocks[0].to, 80);
  assert.equal(blocks[0].spec.block, true);
});

test("a prose-only preview can discover its runtime without existing decorations", async () => {
  class Effect { static appendConfig = { of() {} }; }
  class Compartment { reconfigure() { return new Effect(); } }
  class Priority { constructor(inner, prec) { this.inner = inner; this.prec = prec; } }
  const Decoration = {}, StateField = {}, facet = {};
  const view = { dom: {}, constructor: { decorations: facet }, state: { doc: {}, config: { base: new Priority([], 1) } } };
  let fallbackCalls = 0;
  const context = vm.createContext({
    discoverDecorationClass: () => null,
    loadNativeCodeMirror: async input => { assert.equal(input, view); fallbackCalls++; return Decoration; },
    discoverStateFieldClass: () => StateField,
    discoverDecorationsFacet: () => { throw new Error("native static facet should be used"); },
    extensionValues: value => [value],
  });
  vm.runInContext(source.slice(source.indexOf("    async function discoverCodeMirrorRuntime("), source.indexOf("    function formulaRange(")), context);
  const runtime = await context.discoverCodeMirrorRuntime({ editorView: view, readOnlyCompartment: new Compartment() });
  assert.equal(runtime.Decoration, Decoration);
  assert.equal(runtime.DecorationsFacet, facet);
  assert.equal(runtime.PrecExtension, Priority);
  assert.equal(fallbackCalls, 1);
});
