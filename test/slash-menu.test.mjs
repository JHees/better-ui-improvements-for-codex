import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../scripts/better-ui-imropvement.js', import.meta.url), 'utf8');
const feature = source.slice(source.indexOf('  "slash-menu-polish"() {'));
const between = (start, end) => feature.slice(feature.indexOf(start), feature.indexOf(end));

test('favorite controls preserve their SVG until the favorite state changes', () => {
  class Element {
    dataset = {};
    writes = 0;
    attributes = {};
    setAttribute(key, value) { this.attributes[key] = value; }
    set innerHTML(value) { this.markup = value; this.writes++; }
  }
  const control = new Element();
  const row = new Element();
  row.firstElementChild = row;
  row.querySelector = () => control;
  const ensure = vm.runInNewContext(`${between('    const ensureFavoriteControl =', '    const unwrapSkillRow =')}\nensureFavoriteControl`, {
    HTMLElement: Element, FAVORITE_KEY_ATTR: 'favorite-key', FAVORITE_BUTTON_CLASS: 'favorite',
    starIconSvg: active => `<svg>${active}</svg>`,
  });
  ensure(row, 'skills:example', new Set());
  for (let i = 0; i < 30; i++) ensure(row, 'skills:example', new Set());
  assert.equal(control.writes, 1);
  ensure(row, 'skills:example', new Set(['skills:example']));
  assert.equal(control.writes, 2);
  assert.equal(control.dataset.favorite, 'true');
  assert.equal(control.attributes['aria-label'], 'Remove from favorites');
  ensure(row, 'skills:example', new Set());
  assert.equal(control.writes, 3);
});

test('favorite keys exclude icon CSS and localized Skills keeps its own section key', () => {
  class Element {
    constructor(tagName, text = '', children = [], attrs = {}) {
      this.tagName = tagName;
      this.ownText = text;
      this.children = children;
      this.attributes = attrs;
      this.className = attrs.className || '';
      this.removed = false;
      for (const child of children) child.parentElement = this;
    }
    get textContent() {
      return this.removed ? '' : this.ownText + this.children.map(child => child.textContent).join(' ');
    }
    cloneNode() { return new Element(this.tagName, this.ownText, this.children.map(child => child.cloneNode()), {...this.attributes}); }
    querySelectorAll(selector) {
      const descendants = this.children.flatMap(child => [child, ...child.querySelectorAll(selector)]);
      if (selector === '.truncate') return descendants.filter(child => child.className === 'truncate');
      if (selector.includes('text-token-description-foreground') || selector.includes('text-codex-description')) {
        return descendants.filter(child => /text-token-description-foreground|text-codex-description/.test(child.className));
      }
      return descendants.filter(child =>
        ['svg', 'style', 'script'].includes(child.tagName.toLowerCase()) || child.attributes.favorite,
      );
    }
    querySelector(selector) {
      const descendants = this.querySelectorAll(selector);
      if (selector === ':scope > .sticky.top-0') return this.children.find(child => child.className === 'sticky top-0');
      if (selector === '.truncate') return descendants.find(child => child.className === 'truncate') || null;
      if (selector.includes('text-token-description-foreground') || selector.includes('text-codex-description')) {
        return descendants.find(child => /text-token-description-foreground|text-codex-description/.test(child.className)) || null;
      }
      return null;
    }
    matches(selector) {
      if (selector === '[section]') return 'section' in this.attributes;
      if (selector === '[data-mention-section-id]') return 'data-mention-section-id' in this.attributes;
      if (selector === '.truncate') return this.className.includes('truncate');
      if (selector.includes('text-token-description-foreground') || selector.includes('text-codex-description')) {
        return /text-token-description-foreground|text-codex-description/.test(this.className);
      }
      if (selector.includes('ms-auto')) return /ms-auto|ml-auto/.test(this.className);
      return false;
    }
    closest(selector) {
      for (let node = this; node; node = node.parentElement) if (node.matches?.(selector)) return node;
      return null;
    }
    getAttribute(name) { return this.attributes[name] ?? null; }
    hasAttribute(name) { return name in this.attributes; }
    remove() { this.removed = true; }
  }
  const heading = new Element('div', '技能', []);
  heading.className = 'sticky top-0';
  const group = new Element('div', '', [heading], {section: 'skills'});
  const row = new Element('button', '', [
    new Element('span', 'Zotero Search ', [new Element('span', 'Zotero and add citations', [], {className: 'text-token-description-foreground'})], {className: 'truncate'}),
    new Element('svg', '@supports (color:color(display-p3 1 1 1))'),
    new Element('span', '', [new Element('svg', '')], {favorite: true}),
  ], {'data-value': 'Zotero Search'});
  row.parentElement = group;
  const helpers = vm.runInNewContext(`${between('    const favoriteText =', '    const isSlashSearchActive =')}\n({favoriteText, favoriteRowSnapshot, rowFavoriteKey, legacyRowFavoriteKeys})`, {
    HTMLElement: Element,
    SECTION_ATTR: 'section',
    FAVORITE_BUTTON_CLASS: 'favorite',
    SKILL_COPY_CLASS: 'skill-copy',
    DESCRIPTION_SELECTOR: 'span[class*="text-token-description-foreground"], span[class*="text-codex-description"]',
    nativeSlashEntry: () => null,
    normText: node => String(node?.textContent || '').replace(/\s+/g, ' ').trim(),
  });
  assert.equal(helpers.favoriteText(row), 'Zotero Search Zotero and add citations');
  assert.equal(helpers.rowFavoriteKey(row), 'skills:zotero search');
  assert.equal(helpers.rowFavoriteKey(row, undefined, false, new Map([['skills:zotero', {
    label: 'Zotero', description: 'Search Zotero and add citations',
  }]])), 'skills:zotero');
  assert.ok(helpers.legacyRowFavoriteKeys(row).some(key => key.startsWith('general:')));
  assert.deepEqual({...helpers.favoriteRowSnapshot(row)}, {
    label: 'Zotero Search', description: 'Zotero and add citations', section: '技能', query: 'Zotero Search',
  });
  const sectionKey = vm.runInNewContext(`${between('    const sectionKey =', '    const sectionColor =')}\nsectionKey`);
  assert.equal(sectionKey('技能'), 'skills');
  assert.equal(sectionKey('General'), 'general');
});

test('favorite metadata uses a separate text-only store and leaves saved favorite keys intact', () => {
  const favoritesKey = 'codexpp.slashMenuFavorites.v1';
  const metadataKey = 'codexpp.slashMenuFavoriteMetadata.v1';
  const values = new Map([[favoritesKey, JSON.stringify(['legacy:command'])]]);
  const helpers = vm.runInNewContext(`${between('    const readFavorites =', '    const favoriteText =')}\n({readFavorites, readFavoriteMetadata, writeFavoriteMetadata})`, {
    FAVORITES_STORAGE_KEY: favoritesKey,
    FAVORITE_METADATA_STORAGE_KEY: metadataKey,
    window: {localStorage: {getItem: key => values.get(key), setItem: (key, value) => values.set(key, value)}},
  });
  assert.deepEqual(Array.from(helpers.readFavorites()), ['legacy:command']);
  assert.equal(helpers.readFavoriteMetadata().size, 0);
  helpers.writeFavoriteMetadata(new Map([['skills:zotero', {
    label: 'Zotero Search', description: 'Add citations', section: '技能', query: 'Zotero Search',
  }]]));
  assert.deepEqual(JSON.parse(values.get(favoritesKey)), ['legacy:command']);
  assert.deepEqual(JSON.parse(values.get(metadataKey)), [{key: 'skills:zotero', value: {
    label: 'Zotero Search', description: 'Add citations', section: '技能', query: 'Zotero Search',
  }}]);
});

test('native slash item props keep favorite title and key stable across filtered row layouts', () => {
  class Element {
    constructor(tagName, text = '', children = [], attrs = {}) {
      this.tagName = tagName; this.textContent = text; this.children = children; this.attributes = attrs;
      for (const child of children) child.parentElement = this;
    }
    querySelector() { return null; }
    querySelectorAll() { return []; }
    getAttribute(name) { return this.attributes[name] ?? null; }
    matches(selector) { return selector === '[data-mention-section-id]' && 'data-mention-section-id' in this.attributes; }
    closest(selector) { for (let node = this; node; node = node.parentElement) if (node.matches(selector)) return node; return null; }
  }
  const nativeProps = {sections: [
    {id: 'General', title: 'General', items: [{key: 'general:other', content: {props: {title: 'Other'}}}]},
    {id: '技能', title: '技能', items: [
      {key: 'skill:wrong-index', content: {props: {title: 'Wrong item'}}},
      {key: 'skill:private-path', content: {props: {title: 'Zotero', query: 'zotero', description: 'Search Zotero and add citations'}}},
    ]},
  ]};
  const rows = [
    new Element('button', '', [new Element('span', 'ZoteroSearch Search Zotero and add citations')]),
    new Element('button', '', [new Element('span', 'Zotero Search Zotero and add citations')]),
  ];
  const groups = rows.map((row, index) => {
    let fiber = {key: index === 0 ? 'skill:private-path' : null, memoizedProps: {itemIndex: 2}, return: null};
    for (let depth = 0; depth < 8; depth++) fiber = {memoizedProps: {}, return: fiber};
    fiber = {memoizedProps: {sections: nativeProps.sections}, return: fiber};
    row.__reactFiber$fixture = fiber;
    const group = new Element('div', '', [row], {'data-mention-section-id': '技能', section: 'general'});
    return group;
  });
  const props = vm.runInNewContext(`${between('    const nativeSlashEntry =', '    const sectionColor =')}\n({nativeSlashEntry, sectionKey})`, {
    HTMLElement: Element,
    nativeSlashEntryCache: new WeakMap(),
    nativeSlashEntryGeneration: 1,
    DESCRIPTION_SELECTOR: 'span.description',
    favoriteText: node => String(node?.textContent || '').replace(/\s+/g, ' ').trim(),
    sectionKey: value => value === '技能' ? 'skills' : String(value).toLowerCase(),
  });
  const helpers = vm.runInNewContext(`${between('    const favoriteText =', '    const isSlashSearchActive =')}\n({favoriteRowSnapshot, rowFavoriteKey})`, {
    HTMLElement: Element,
    SECTION_ATTR: 'section',
    FAVORITE_BUTTON_CLASS: 'favorite',
    SKILL_COPY_CLASS: 'skill-copy',
    DESCRIPTION_SELECTOR: 'span.description',
    nativeSlashEntry: props.nativeSlashEntry,
    sectionKey: props.sectionKey,
    normText: node => String(node?.textContent || '').replace(/\s+/g, ' ').trim(),
  });
  assert.deepEqual(rows.map(row => helpers.rowFavoriteKey(row)), ['skills:zotero', 'skills:zotero']);
  assert.deepEqual({...helpers.favoriteRowSnapshot(rows[0])}, {
    label: 'Zotero', description: 'Search Zotero and add citations', section: '技能', query: 'zotero',
  });
  assert.equal(groups.length, 2);
});

test('saved favorites match an active slash filter by title and remain visible for the empty query', () => {
  class Element { constructor(offsetParent = {}) { this.offsetParent = offsetParent; } }
  const matches = vm.runInNewContext(`${between('    const favoriteMatchesSearch =', '    const refreshFavoriteViews =')}\nfavoriteMatchesSearch`, {HTMLElement: Element});
  const metadata = {label: 'Zotero', query: 'zotero'};
  assert.equal(matches(metadata, null, ''), true);
  assert.equal(matches(metadata, null, 'zotero'), true);
  assert.equal(matches(metadata, null, 'test'), false);
  assert.equal(matches(metadata, new Element(null), 'test'), false);
  assert.equal(matches(metadata, new Element({}), 'test'), true);
});

test('a missing source favorite is rebuilt from text nodes, not stored markup', () => {
  class Element {
    constructor(tagName) { this.tagName = tagName; this.attributes = {}; this.children = []; }
    setAttribute(name, value) { this.attributes[name] = value; }
    appendChild(child) { this.children.push(child); return child; }
  }
  const makeFavoriteClone = vm.runInNewContext(`${between('    const makeFavoriteClone =', '    const syncSectionVisibility =')}\nmakeFavoriteClone`, {
    HTMLElement: Element,
    document: {createElement: name => new Element(name)},
    FAVORITE_KEY_ATTR: 'favorite-key',
    SKILL_COPY_CLASS: 'skill-copy',
  });
  const clone = makeFavoriteClone('skills:zotero', null, {
    label: '<img src=x onerror=alert(1)>', description: 'Add citations', section: '技能',
  });
  assert.equal(clone.tagName, 'div');
  assert.equal(clone.attributes['aria-label'], '<img src=x onerror=alert(1)>, Add citations');
  assert.equal(clone.children[0].children[0].children[0].textContent, '<img src=x onerror=alert(1)>');
  assert.equal(clone.children[0].children[0].children[1].textContent, 'Add citations');
  assert.equal(clone.children[0].children[1].textContent, '技能');
  assert.equal(clone.innerHTML, undefined);
});

test('primary favorite pointer activation is the only pointer route and filters modifiers', () => {
  const isPrimary = vm.runInNewContext(`${between('    const isPrimaryUnmodifiedEvent =', '    const findFavoriteSource =')}\nisPrimaryUnmodifiedEvent`);
  assert.equal(isPrimary({button: 0}), true);
  assert.equal(isPrimary({button: 0, shiftKey: true}), false);
  assert.equal(isPrimary({button: 0, ctrlKey: true}), false);
  assert.equal(isPrimary({button: 2}), false);
  const favoriteSync = between('    const syncFavoritesSection =', '    const navigationRows =');
  assert.match(favoriteSync, /clone\.addEventListener\("pointerdown"[\s\S]*?\}, true\)/u);
  assert.match(favoriteSync, /if \(pointerClickPending\)[\s\S]*?event\.detail !== 0/u);
  assert.match(favoriteSync, /setFavoriteActivationTimer\(clearPointerClick, 1000\)/u);
  assert.match(feature, /event\.key === "Enter" && event\.repeat/u);
  assert.match(feature, /if \(event\.repeat\) return/u);
  assert.match(feature.slice(feature.indexOf('    return () => {')), /cancelPendingFavoriteActivation\(\)[\s\S]*?favoriteActivationTimers\.clear\(\)/u);
});

test('favorite filter activation restores only an untouched plain slash draft and owns its pending work', async () => {
  const execute = async ({sourceAvailable = false, userEdits = false, paste = false, sameTextMutation = false, asyncNormalize = false, selectionChanges = false, blurAway = false, stop = false, parallel = false, richDraft = false} = {}) => {
    let timeoutCallback;
    let rootObserverCallback;
    let clicks = 0;
    let nextTimer = 0;
    const liveTimers = new Set();
    const documentListeners = new Map();
    let normalizeEditor;
    const root = {parentElement: null, searchReady: false, closest() { return null; }, querySelectorAll() { return []; }};
    const overlay = {parentElement: root};
    const menu = {parentElement: overlay, closest: selector => selector.includes('composer-overlay') ? overlay : null};
    const listeners = new Map();
    let selection;
    class Element {
      constructor() { this.isConnected = true; this.tagName = 'DIV'; this.attributes = {}; this.focusCalls = 0; }
      matches(selector) { return selector.includes('ProseMirror') && this === editor; }
      closest() { return menu; }
      focus() { this.focusCalls++; }
      addEventListener(type, callback) { const list = listeners.get(type) || []; list.push(callback); listeners.set(type, list); }
      removeEventListener(type, callback) { listeners.set(type, (listeners.get(type) || []).filter(value => value !== callback)); }
      emit(type, extra = {}) { for (const callback of listeners.get(type) || []) callback({type, target: this, ...extra}); }
      contains(node) { return node === this; }
    }
    class Editor extends Element {
      constructor() { super(); this.nodes = [this.makeNode('/')]; }
      makeNode(value, attributes = {}) {
        const node = {value, attributes, tagName: 'P', parentElement: this};
        Object.defineProperty(node, 'textContent', {get() { return node.value; }, set(next) { node.value = next; root.searchReady = next.startsWith('/'); }});
        node.cloneNode = () => this.makeNode(node.value, {...node.attributes});
        node.isEqualNode = other => other?.value === node.value && other?.tagName === node.tagName && JSON.stringify(other?.attributes || {}) === JSON.stringify(node.attributes);
        return node;
      }
      get childNodes() { return this.nodes; }
      get children() { return this.nodes.filter(node => node.tagName === 'P'); }
      get innerHTML() { return this.nodes.map(node => node.value).join(''); }
      get textContent() { return this.innerHTML; }
      set textContent(value) { this.nodes = [this.makeNode(value)]; root.searchReady = value.startsWith('/'); }
      contains(node) { return node === this || this.nodes.includes(node); }
      querySelectorAll(selector) { return selector === '*' ? (richDraft ? [new ElementTag('STRONG')] : this.nodes) : []; }
      replaceChildren(...nodes) { this.nodes = nodes; for (const node of nodes) node.parentElement = this; }
      dispatchEvent(event) {
        this.emit(event.type, event);
        if (event.inputType === 'insertText' && asyncNormalize) {
          normalizeEditor = () => {
            this.nodes = [this.makeNode(this.textContent)];
            selection.anchorNode = this.nodes[0];
            selection.focusNode = this.nodes[0];
            rootObserverCallback?.();
          };
        }
        return true;
      }
    }
    class ElementTag { constructor(tagName) { this.tagName = tagName; this.className = ''; } }
    const editor = new Editor();
    const outside = new Element();
    selection = {
      rangeCount: 1, anchorNode: editor, anchorOffset: 0, focusNode: editor, focusOffset: 0,
      setBaseAndExtent(anchorNode, anchorOffset, focusNode, focusOffset) {
        Object.assign(selection, {anchorNode, anchorOffset, focusNode, focusOffset});
      },
      removeAllRanges() { selection.rangeCount = 0; },
      addRange(range) { selection.rangeCount = 1; selection.anchorNode = range.node; selection.focusNode = range.node; selection.anchorOffset = range.offset; selection.focusOffset = range.offset; },
    };
    const source = new Element();
    source.click = () => { clicks++; };
    const scroller = new Element();
    scroller.closest = () => menu;
    const context = {
      HTMLElement: Element,
      Element,
      document: {
        activeElement: editor,
        body: root,
        querySelectorAll: () => [editor],
        addEventListener(type, callback) { documentListeners.set(type, callback); },
        removeEventListener(type, callback) { if (documentListeners.get(type) === callback) documentListeners.delete(type); },
      createRange() {
          const range = {node: null, offset: 0, selectNodeContents(node) { this.node = node; this.offset = 0; }, collapse(toEnd) { if (toEnd) this.offset = this.node.textContent.length; }, setStart(node, offset) { this.node = node; this.offset = offset; }, setEnd(node, offset) { this.node = node; this.offset = offset; }, toString: () => ''};
          return range;
        },
        createTreeWalker(node) {
          const textNodes = node.nodes.map(child => ({textContent: child.value}));
          let index = 0;
          return {nextNode: () => textNodes[index++] || null};
        },
      },
      window: {getSelection: () => selection},
      MutationObserver: class {
        constructor(callback) { this.callback = callback; }
        observe(target) {
          if (target === root) rootObserverCallback = this.callback;
        }
        disconnect() {}
      },
      InputEvent: class { constructor(type, options) { this.type = type; Object.assign(this, options); } },
      FAVORITE_ACTIVATION_TIMEOUT: 750,
      MENU_ATTR: 'menu',
      disposed: false,
      favoriteActivationInFlight: false,
      pendingFavoriteActivation: null,
      setFavoriteActivationTimer: callback => { const id = ++nextTimer; liveTimers.add(id); timeoutCallback = callback; return id; },
      clearFavoriteActivationTimer: id => liveTimers.delete(id),
      readFavoriteMetadata: () => new Map([['skills:zotero', {label: 'Zotero', query: 'zotero'}]]),
      findFavoriteSource: (candidateRoot, key) => candidateRoot.searchReady && sourceAvailable && key === 'skills:zotero' ? source : null,
      rowFavoriteKey: () => 'skills:zotero',
      normText: node => String(node?.textContent || '').replace(/\s+/g, ' ').trim(),
      nativeSlashEntryCache: new WeakMap(),
      nativeSlashEntryGeneration: 1,
      sectionKey: value => value === '技能' ? 'skills' : String(value).toLowerCase(),
      nativeSlashEntry: () => null,
    };
    const activate = vm.runInNewContext(`${between('    const isPlainSlashDraft =', '    const makeFavoriteClone =')}\n({activateFavoriteClone, cancelPendingFavoriteActivation})`, context);
    const pending = activate.activateFavoriteClone(scroller, 'skills:zotero', null);
    const duplicate = parallel ? await activate.activateFavoriteClone(scroller, 'skills:zotero', null) : null;
    let stoppedText = null;
    if (stop) {
      activate.cancelPendingFavoriteActivation();
      stoppedText = editor.textContent;
    } else if (paste) {
      editor.emit('beforeinput', {inputType: 'insertFromPaste'});
      editor.textContent += 'QA';
      editor.emit('input', {inputType: 'insertFromPaste'});
    } else if (userEdits) {
      editor.emit('beforeinput', {isTrusted: true});
      editor.textContent = 'user edit';
    } else if (sameTextMutation) {
      editor.nodes = [editor.makeNode('/zotero', {bold: true})];
      rootObserverCallback?.();
    } else if (selectionChanges || blurAway) {
      selection.anchorNode = outside;
      selection.focusNode = outside;
      context.document.activeElement = outside;
      if (selectionChanges) documentListeners.get('selectionchange')?.();
      if (blurAway) editor.emit('blur');
    } else if (asyncNormalize) {
      normalizeEditor?.();
      timeoutCallback?.();
    } else if (!sourceAvailable && !richDraft) {
      timeoutCallback?.();
    }
    const result = await pending;
    return {
      result, duplicate, clicks, text: editor.textContent, stoppedText, timers: liveTimers.size,
      focusCalls: editor.focusCalls, activeOutside: context.document.activeElement === outside,
      selectionOutside: selection.anchorNode === outside,
    };
  };
  const idle = {duplicate: null, clicks: 0, stoppedText: null, timers: 0, focusCalls: 0, activeOutside: false, selectionOutside: false};
  assert.deepEqual(await execute(), {result: false, ...idle, text: '/'});
  assert.deepEqual(await execute({sourceAvailable: true, parallel: true}), {result: true, ...idle, duplicate: false, clicks: 1, text: '/zotero'});
  assert.deepEqual(await execute({userEdits: true}), {result: false, ...idle, text: 'user edit'});
  assert.deepEqual(await execute({paste: true}), {result: false, ...idle, text: '/QA'});
  assert.deepEqual(await execute({sameTextMutation: true}), {result: false, ...idle, text: '/zotero'});
  assert.deepEqual(await execute({asyncNormalize: true}), {result: false, ...idle, text: '/'});
  assert.deepEqual(await execute({selectionChanges: true}), {result: false, ...idle, text: '/', activeOutside: true, selectionOutside: true});
  assert.deepEqual(await execute({blurAway: true}), {result: false, ...idle, text: '/', activeOutside: true, selectionOutside: true});
  assert.deepEqual(await execute({stop: true}), {result: false, ...idle, text: '/', stoppedText: '/', timers: 0});
  assert.deepEqual(await execute({richDraft: true}), {result: false, ...idle, text: '/'});
});

test('hover scroll freeze tracks only navigation-row hover and resets to the current scroll position', () => {
  class Element {
    contains(node) { return node === row; }
    closest() { return this === row ? row : null; }
  }
  class HtmlElement extends Element {}
  const menu = new HtmlElement();
  const row = new HtmlElement();
  const other = new HtmlElement();
  let freezes = 0;
  let stopped = 0;
  const guard = vm.runInNewContext(`${between('    const stopHoverSelectionEvent =', '    const installDocumentHoverGuard =')}\nstopHoverSelectionEvent`, {
    HTMLElement: HtmlElement,
    Element,
    trackPointerPosition() {},
    shouldBlockSuppressedHover: () => false,
    freezeHoverScroll: () => freezes++,
  });
  const eventFor = target => ({
    target,
    stopPropagation: () => stopped++,
    stopImmediatePropagation() { stopped++; },
  });
  guard(menu, eventFor(other));
  assert.equal(freezes, 0);
  guard(menu, eventFor(row));
  assert.equal(freezes, 1);
  assert.equal(stopped, 4);

  const state = {freezeTop: 220, lastTop: 220, freezeUntil: 0, programmaticTarget: null, programmaticUntil: 0};
  const scroller = new HtmlElement();
  scroller.scrollTop = 140;
  const freeze = vm.runInNewContext(`${between('    const freezeHoverScroll =', '    const clearHoverScrollFreeze =')}\nfreezeHoverScroll`, {
    HTMLElement: HtmlElement,
    performance: {now: () => 10},
    hoverScrollStateFor: () => state,
    requestHoverScrollFreezeFrame() {},
  });
  menu.querySelector = () => scroller;
  freeze(menu);
  assert.equal(state.freezeTop, 140);
  assert.equal(state.lastTop, 140);
});

test('scroll topbar updates use the latest section cache without processing rows', () => {
  class Element {}
  const topbar = new Element();
  topbar.hasAttribute = () => true;
  topbar.dataset = {};
  topbar.style = {setProperty() {}};
  topbar.querySelector = () => ({});
  topbar.querySelectorAll = () => [];
  const scroller = {scrollTop: 20, previousElementSibling: topbar};
  const sectionCache = new WeakMap();
  sectionCache.set(scroller, [{group: {}, title: 'Skills', key: 'skills', color: 'blue'}]);
  let title;
  const update = vm.runInNewContext(`${between('    const updateTopbar =', '    const enhanceMenu =')}\nupdateTopbar`, {
    HTMLElement: Element, TOPBAR_ATTR: 'topbar', SECTION_TITLE_ATTR: 'title', SECTION_ICON_ATTR: 'icon',
    sectionCache, sectionTop: () => 0, setTopbarTitle: (_, value) => { title = value; },
    groupSections: () => { throw new Error('scroll must not decorate every row'); },
  });
  for (let i = 0; i < 30; i++) update(scroller);
  assert.equal(title, 'Skills');
  sectionCache.set(scroller, [{group: {}, title: 'Favorites', key: 'favorites', color: 'gold'}]);
  update(scroller);
  assert.equal(title, 'Favorites');
});

test('topbar section jumps deduplicate repeated keys and expose labels', () => {
  class Element {
    constructor() { this.dataset = {}; this.attributes = {}; this.children = []; this.listeners = new Map(); this.style = {setProperty() {}}; }
    hasAttribute(name) { return name in this.attributes; }
    setAttribute(name, value) { this.attributes[name] = value; }
    addEventListener(type, callback) { const callbacks = this.listeners.get(type) || []; callbacks.push(callback); this.listeners.set(type, callbacks); }
    replaceChildren() { this.children = []; }
    appendChild(child) { this.children.push(child); }
    querySelector() { return icons; }
  }
  const icons = new Element();
  const topbar = new Element();
  topbar.querySelector = () => icons;
  topbar.nextElementSibling = new Element();
  const jumped = [];
  const render = vm.runInNewContext(`${between('    const renderTopbarIcons =', '    const scrollToSection =')}\nrenderTopbarIcons`, {
    HTMLElement: Element,
    SECTION_ICON_ATTR: 'section-icon',
    sectionIconSvg: key => `<svg>${key}</svg>`,
    document: {createElement: () => new Element()},
    isPrimaryUnmodifiedEvent: event => event.button === 0 && !event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey,
    scrollToSection: (_scroller, section) => jumped.push(section.key),
    updateTopbar() {},
  });
  const sections = [
    {group: {}, key: 'general', title: 'General', color: 'blue'},
    {group: {}, key: 'skills', title: '技能', color: 'green'},
    {group: {}, key: 'general', title: 'General', color: 'blue'},
  ];
  render(topbar, sections);
  assert.equal(icons.children.length, 2);
  assert.deepEqual(icons.children.map(button => button.attributes['aria-label']), ['General', '技能']);
  assert.deepEqual(icons.children.map(button => button.title), ['General', '技能']);
  let prevented = false;
  const pointerEvent = {button: 0, detail: 1, preventDefault() { prevented = true; }, stopPropagation() {}};
  icons.children[0].listeners.get('pointerdown')[0](pointerEvent);
  assert.equal(prevented, true);
  const clickEvent = {button: 0, detail: 1, preventDefault() {}, stopPropagation() {}};
  icons.children[0].listeners.get('click')[0](clickEvent);
  icons.children[1].listeners.get('click')[0]({...clickEvent, detail: 0});
  assert.deepEqual(jumped, ['general', 'skills']);
});
