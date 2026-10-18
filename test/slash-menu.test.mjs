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
