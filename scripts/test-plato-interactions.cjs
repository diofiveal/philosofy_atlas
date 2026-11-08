/** Component interaction tests in jsdom. No browser, layout, or screenshots. */
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const { JSDOM } = require('jsdom');
const reduced = process.argv.includes('--reduced');
const dom = new JSDOM('<!doctype html><html><body><div id="test-root"></div></body></html>', { url: 'http://localhost/', pretendToBeVisual: true });
const window = dom.window;
for (const key of ['window', 'document', 'HTMLElement', 'Element', 'Node', 'SVGElement', 'HTMLInputElement', 'HTMLTextAreaElement', 'MutationObserver', 'Event', 'MouseEvent', 'KeyboardEvent', 'getComputedStyle']) global[key] = key === 'window' ? window : typeof window[key] === 'function' && key === 'getComputedStyle' ? window[key].bind(window) : window[key];
Object.defineProperty(global, 'navigator', { value: window.navigator, configurable: true });
global.IS_REACT_ACT_ENVIRONMENT = true;
window.matchMedia = query => ({ matches: query.includes('prefers-reduced-motion') && reduced, media: query, onchange: null, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent() { return true; } });
global.requestAnimationFrame = window.requestAnimationFrame.bind(window);
global.cancelAnimationFrame = window.cancelAnimationFrame.bind(window);
class ResizeObserver { observe() {} unobserve() {} disconnect() {} }
window.ResizeObserver = global.ResizeObserver = ResizeObserver;
window.HTMLElement.prototype.scrollIntoView = function() {};
window.scrollTo = function() {};
const project = path.resolve(__dirname, '..');
const resolveFilename = Module._resolveFilename;
Module._resolveFilename = function(request, parent, ...args) { return resolveFilename.call(this, request.startsWith('@/') ? path.join(project, 'src', request.slice(2)) : request, parent, ...args); };
for (const extension of ['.ts', '.tsx']) require.extensions[extension] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true }, fileName: filename }).outputText, filename);
require.extensions['.css'] = () => {};
const React = require('react');
const { act } = React;
const { createRoot } = require('react-dom/client');
const { BiographyAccordion, PhilosophyIdeaCard, BooksGallery, IdeaDialogue } = require('../src/components/plato/PlatoPage.tsx');
const Map = require('../src/components/plato/PhilosophyConnectionsMap.tsx').default;
const { platoProfile: profile } = require('../src/data/plato.ts');
const container = document.getElementById('test-root');
let root, checks = 0;
function check(condition, message) { checks++; if (!condition) throw new Error(message); }
const text = element => element?.textContent ?? '';
const findButton = (label, within = container) => [...within.querySelectorAll('button')].find(button => text(button).includes(label));
async function flush(ms = 40) { await act(async () => { await new Promise(resolve => setTimeout(resolve, ms)); }); }
async function render(element) { if (root) await act(async () => root.unmount()); container.innerHTML = ''; root = createRoot(container); await act(async () => root.render(element)); await flush(); }
async function click(element) { check(Boolean(element), 'Expected clickable element'); await act(async () => element.dispatchEvent(new window.MouseEvent('click', { bubbles: true }))); }
async function key(element, value) { check(Boolean(element), 'Expected keyboard target'); await act(async () => element.dispatchEvent(new window.KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true }))); }
async function chapterTests() {
  function Harness() { const [active, setActive] = React.useState(null); return React.createElement(BiographyAccordion, { profile, activeId: active, onChange: chapter => setActive(chapter?.id ?? null) }); }
  await render(React.createElement(Harness));
  check(container.querySelectorAll('[aria-expanded="true"]').length === 0, 'Biography starts with all chapters closed');
  for (const chapter of profile.chapters) {
    const trigger = container.querySelector(`#chapter-trigger-${chapter.id}`);
    await click(trigger);
    check(trigger.getAttribute('aria-expanded') === 'true', `Chapter ${chapter.id} opens`);
    check(container.querySelectorAll('[aria-expanded="true"]').length === 1, 'Only one chapter is expanded');
    check(text(container.querySelector(`#chapter-panel-${chapter.id}`)).includes(chapter.paragraphs[0]), `Chapter ${chapter.id} story is rendered`);
    check(container.querySelector('.plato-biography-stage [data-theme-id]').dataset.themeId === chapter.themeId, `Chapter ${chapter.id} selects its own backdrop`);
    await click(trigger);
    check(trigger.getAttribute('aria-expanded') === 'false', `Chapter ${chapter.id} closes`);
    check(!trigger.hasAttribute('aria-controls'), 'Closed trigger does not reference absent content');
  }
  for (const index of [0, 4, 1]) await click(container.querySelector(`#chapter-trigger-${profile.chapters[index].id}`));
  check(container.querySelector('#chapter-trigger-socrates').getAttribute('aria-expanded') === 'true', 'Rapid chapter sequence ends at intended chapter');
  check(container.querySelectorAll('.plato-scene-layer').length <= 2, 'Rapid switching retains at most two backdrop layers');
  check([...container.querySelectorAll('[aria-hidden="true"].plato-chapter-panel')].every(panel => panel.hasAttribute('inert')), 'Exiting chapter panels are inert');
  const first = container.querySelector(`#chapter-trigger-${profile.chapters[0].id}`);
  first.focus(); await key(first, 'End');
  check(document.activeElement.id === `chapter-trigger-${profile.chapters.at(-1).id}`, 'End focuses final chapter');
  await key(document.activeElement, 'Home');
  check(document.activeElement === first, 'Home focuses first chapter');
  await click(findButton('Дальше'));
  check(container.querySelector('#chapter-trigger-academy').getAttribute('aria-expanded') === 'true', 'Next chapter navigation opens adjacent chapter');
  await click(findButton('Назад'));
  check(container.querySelector('#chapter-trigger-socrates').getAttribute('aria-expanded') === 'true', 'Previous chapter navigation works');
}
async function ideaTests() {
  for (const idea of profile.ideas) {
    function Harness() { const [active, setActive] = React.useState(false); return React.createElement(PhilosophyIdeaCard, { idea, profile, active, onToggle: () => setActive(value => !value) }); }
    await render(React.createElement(Harness));
    const trigger = container.querySelector(`#idea-trigger-${idea.id}`);
    await click(trigger);
    check(trigger.getAttribute('aria-expanded') === 'true', `${idea.id}: idea opens`);
    check(container.querySelector('[data-theme-id]').dataset.themeId === idea.themeId, `${idea.id}: own theme is selected`);
    if (reduced) check(container.querySelectorAll('.plato-idea-prose > p').length === idea.paragraphs.length, `${idea.id}: reduced motion reveals full story immediately`);
    else {
      const showAll = findButton('Показать весь рассказ');
      if (showAll && !showAll.disabled) await click(showAll);
      check(container.querySelectorAll('.plato-idea-prose > p').length === idea.paragraphs.length, `${idea.id}: skip shows entire story`);
    }
    check(container.querySelector(`[data-testid="dialogue-${idea.questionId}"]`), `${idea.id}: interactive question is present`);
    await click(trigger);
    check(trigger.getAttribute('aria-expanded') === 'false', `${idea.id}: idea closes`);
    const exiting = container.querySelector('.plato-idea-panel');
    check(!exiting || exiting.hasAttribute('inert'), `${idea.id}: exiting content is inert`);
  }
}
async function bookTests() {
  await render(React.createElement(BooksGallery, { profile }));
  const tabs = [...container.querySelectorAll('[role="tab"]')];
  check(tabs.length === 5, 'Five book tabs rendered');
  for (let i = 0; i < tabs.length; i++) {
    await click(tabs[i]); await flush(reduced ? 50 : 260);
    check(tabs[i].getAttribute('aria-selected') === 'true', `Book ${i + 1} selected`);
    check(text(container.querySelector('[role="tabpanel"]')).includes(profile.works[i].recommendation), `Book ${i + 1} recommendation changes`);
    check(container.querySelector('[role="tabpanel"] a').href === profile.works[i].readingUrl, `Book ${i + 1} primary text link`);
  }
  await key(tabs.at(-1), 'Home'); await flush(reduced ? 50 : 240);
  check(document.activeElement === tabs[0] && tabs[0].getAttribute('aria-selected') === 'true', 'Book Home selects/focuses first tab');
  await key(tabs[0], 'ArrowRight'); await flush(reduced ? 50 : 240);
  check(document.activeElement === tabs[1] && tabs[1].getAttribute('aria-selected') === 'true', 'Book Right selects/focuses next tab');
  await key(tabs[1], 'End');
  check(document.activeElement === tabs.at(-1), 'Book End focuses last tab');
}
async function dialogueTests() {
  for (const question of profile.questions) {
    await render(React.createElement(IdeaDialogue, { question }));
    const options = [...container.querySelectorAll('.plato-dialogue-options button')];
    for (let i = 0; i < options.length; i++) {
      await click(options[i]); await flush(reduced ? 50 : 240);
      check(options[i].getAttribute('aria-pressed') === 'true', `${question.id}: selected choice ${i + 1} marked`);
      check(text(container.querySelector('[aria-live="polite"]')).includes(question.options[i].response), `${question.id}: choice ${i + 1} yields its own reaction`);
    }
    await click(findButton('Подумать заново'));
    check(options.every(option => option.getAttribute('aria-pressed') === 'false'), `${question.id}: reset clears choice`);
    check(document.activeElement === options[0], `${question.id}: reset restores keyboard focus`);
  }
}
async function mapTests() {
  const opened = [];
  await render(React.createElement(Map, { profile, onOpenPhilosopher: id => opened.push(id) }));
  const listButtons = () => [...container.querySelectorAll('.connection-accessible-list button')];
  check(listButtons().length === 6, 'All six relationships are listed');
  for (const connection of profile.connections) {
    const button = listButtons().find(button => text(button).includes(connection.label));
    await click(button);
    check(text(container.querySelector('.connection-detail')).includes(connection.description), `Graph selection ${connection.id} updates details`);
  }
  await click(listButtons().find(button => text(button).includes('Учитель → ученик')));
  await click(findButton('Открыть страницу', container.querySelector('.connection-detail')));
  check(opened[0] === 'socrates', 'Existing philosopher link calls actual catalogue target');
  const filters = [...container.querySelectorAll('.connection-filters button')];
  for (const filter of filters) await click(filter);
  check(listButtons().length === 0, 'All filters off hides relationships');
  check(text(container.querySelector('.connection-detail')).includes('Все типы связей скрыты'), 'All filters off shows useful empty state');
  await click(filters[2]);
  check(listButtons().length === 1 && text(listButtons()[0]).includes('Критика'), 'Criticism-only filter works');
  for (const filter of filters.filter((_, index) => index !== 2)) await click(filter);
  const aristotle = container.querySelector('.connection-person[aria-label^="Аристотель"]');
  await key(aristotle, 'Enter');
  check(text(container.querySelector('.connection-detail h3')) === 'Аристотель', 'Keyboard activation of graph node updates selected relationship');
  const controls = [...container.querySelectorAll('.react-flow__controls button')];
  check(controls.some(button => button.getAttribute('aria-label') === 'Увеличить карту'), 'Zoom controls have Russian accessible names');
}
(async () => {
  try {
    await chapterTests(); await ideaTests(); await bookTests(); await dialogueTests(); await mapTests();
    await act(async () => root.unmount());
    console.log(`PASS: ${checks} component interaction assertions (${reduced ? 'reduced' : 'normal'} motion). Chapters, capped backdrops, ideas/skip, books/keyboard, all 24 dialogue choices/reset, map filters/details/navigation/keyboard.`);
    console.log('Scope: jsdom state/DOM tests only. No claims about browser hydration, visual layout, responsive geometry, pointer pan/zoom, or animation smoothness.');
  } catch (error) {
    console.error(`FAIL after ${checks} assertions:`, error.stack || error);
    process.exitCode = 1;
  } finally { if (root) { try { await act(async () => root.unmount()); } catch {} } window.close(); }
})();
