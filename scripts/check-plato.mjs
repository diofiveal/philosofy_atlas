/** Editorial integrity checks for immersive profiles. Run after npm install. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';

const root = path.resolve(import.meta.dirname, '..');
const nativeRequire = createRequire(import.meta.url);
const cache = new Map();
function loadTs(filename) {
  filename = path.resolve(filename);
  if (cache.has(filename)) return cache.get(filename).exports;
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS },
    fileName: filename,
  });
  const module = { exports: {} };
  cache.set(filename, module);
  const localRequire = specifier => specifier.startsWith('.')
    ? loadTs(path.resolve(path.dirname(filename), `${specifier.replace(/\.ts$/, '')}.ts`))
    : nativeRequire(specifier);
  vm.runInThisContext(`(function(exports, require, module) {\n${compiled.outputText}\n})`, { filename })(module.exports, localRequire, module);
  return module.exports;
}
const { platoProfile: profile } = loadTs(path.join(root, 'src/data/plato.ts'));
const { philosophers } = loadTs(path.join(root, 'src/data/philosophers.ts'));
const catalogueIds = new Set(philosophers.map(p => p.id));
const errors = [];
let checks = 0;
function check(condition, message) { checks++; if (!condition) errors.push(message); }
const filled = value => typeof value === 'string' && value.trim().length > 0;
function idsOf(items, kind) {
  const ids = new Set(items.map(item => item.id));
  check(ids.size === items.length, `${kind}: IDs must be unique`);
  check(items.every(item => /^[a-z][a-z0-9-]*$/.test(item.id)), `${kind}: IDs must be URL-safe slugs`);
  return ids;
}
function https(url, context) {
  let valid = false;
  try { valid = new URL(url).protocol === 'https:'; } catch {}
  check(valid, `${context}: expected valid HTTPS URL (${url})`);
}
function asset(file, context) {
  check(filled(file) && file.startsWith('/') && !file.includes('..'), `${context}: invalid local image path`);
  if (filled(file)) check(fs.existsSync(path.join(root, 'public', file)), `${context}: local image missing (${file})`);
}
check(profile.id === 'plato', 'Profile must be Plato');
check(filled(profile.narrativeNotice), 'Fictional first-person narration requires a visible editorial notice');
check(profile.chapters.length === 5, 'Expected five biography chapters');
check(profile.ideas.length === 5, 'Expected five ideas');
check(profile.works.length === 5, 'Expected five works');
check(profile.dilemmaIds.length === 3 && new Set(profile.dilemmaIds).size === 3, 'Expected three distinct dilemmas');
asset(profile.portrait, 'Profile portrait');
const sourceIds = idsOf(profile.sources, 'Sources');
const themeIds = idsOf(profile.themes, 'Themes');
const workIds = idsOf(profile.works, 'Works');
const questionIds = idsOf(profile.questions, 'Questions');
const personIds = idsOf(profile.people, 'Graph people');
idsOf(profile.chapters, 'Chapters'); idsOf(profile.ideas, 'Ideas'); idsOf(profile.connections, 'Connections');
check(personIds.has(profile.id), 'Graph must contain Plato');
function references(item, context) {
  check(Array.isArray(item.sourceIds) && item.sourceIds.length > 0, `${context}: source references required`);
  for (const id of item.sourceIds ?? []) check(sourceIds.has(id), `${context}: unknown source ${id}`);
}
for (const source of profile.sources) {
  https(source.url, source.id);
  check(filled(source.title), `${source.id}: missing source title`);
  check(['primary', 'academic'].includes(source.kind), `${source.id}: unsupported source kind`);
}
for (const theme of profile.themes) {
  if (theme.image) asset(theme.image, theme.id);
  for (const field of ['gradient', 'text', 'accent']) check(filled(theme[field]), `${theme.id}: missing ${field}`);
  check(Number.isFinite(theme.overlay) && theme.overlay >= 0 && theme.overlay <= 1, `${theme.id}: overlay must be between zero and one`);
}
for (const chapter of profile.chapters) {
  references(chapter, chapter.id);
  check(themeIds.has(chapter.themeId), `${chapter.id}: unknown theme`);
  check(chapter.paragraphs.length >= 3 && chapter.paragraphs.every(filled), `${chapter.id}: biography requires a substantive multi-paragraph story`);
  check(['established', 'qualified', 'disputed'].includes(chapter.confidence), `${chapter.id}: invalid historical confidence`);
  if (chapter.confidence !== 'established') check(filled(chapter.note), `${chapter.id}: qualified chronology needs an editorial note`);
}
for (const idea of profile.ideas) {
  references(idea, idea.id);
  check(themeIds.has(idea.themeId), `${idea.id}: unknown visual theme`);
  check(idea.paragraphs.length >= 3 && idea.paragraphs.every(filled), `${idea.id}: missing developed explanation`);
  check(questionIds.has(idea.questionId), `${idea.id}: missing interactive question`);
  check(idea.workIds.length > 0 && idea.workIds.every(id => workIds.has(id)), `${idea.id}: missing or unknown referenced work`);
}
check(new Set(profile.ideas.map(i => i.themeId)).size === 5, 'Each idea must have its own visual atmosphere');
for (const work of profile.works) {
  references(work, work.id); https(work.readingUrl, work.id);
  for (const field of ['title', 'subtitle', 'recommendation', 'description', 'whyRead']) check(filled(work[field]), `${work.id}: missing ${field}`);
  check(work.questions.length > 0 && work.keyIdeas.length > 0, `${work.id}: missing questions or key ideas`);
}
for (const question of profile.questions) {
  references(question, question.id); idsOf(question.options, `${question.id} options`);
  check(filled(question.prompt), `${question.id}: missing dilemma`);
  check(question.options.length >= 2, `${question.id}: needs at least two choices`);
  check(new Set(question.options.map(o => o.response)).size === question.options.length, `${question.id}: choices need distinct responses`);
  for (const option of question.options) check(filled(option.label) && filled(option.response), `${question.id}/${option.id}: empty choice or reaction`);
}
for (const id of profile.dilemmaIds) check(questionIds.has(id), `Dilemma ${id} missing`);
for (const person of profile.people) {
  if (person.portrait) asset(person.portrait, person.id);
  if (person.href) {
    const match = person.href.match(/(?:#philosopher\/|\/philosophers\/)([a-z0-9-]+)\/?$/);
    check(Boolean(match && catalogueIds.has(match[1])), `${person.id}: linked philosopher page does not exist (${person.href})`);
  }
}
for (const connection of profile.connections) {
  references(connection, connection.id);
  check(personIds.has(connection.source) && personIds.has(connection.target), `${connection.id}: unknown endpoint`);
  check(connection.source !== connection.target, `${connection.id}: graph self-link`);
  check(['teaching', 'influence', 'criticism', 'development'].includes(connection.type), `${connection.id}: invalid relationship type`);
  check(['established', 'qualified', 'disputed'].includes(connection.confidence), `${connection.id}: invalid confidence`);
  check(filled(connection.description), `${connection.id}: missing explanation`);
}
check(new Set(profile.connections.map(c => c.type)).size === 4, 'Graph must distinguish all four relationship types');
check(profile.connections.some(c => c.source === 'socrates' && c.target === 'plato' && c.type === 'teaching'), 'Teacher direction: Socrates → Plato');
check(profile.connections.some(c => c.source === 'plato' && c.target === 'aristotle' && c.type === 'teaching'), 'Teacher direction: Plato → Aristotle');
check(profile.connections.some(c => c.source === 'aristotle' && c.target === 'plato' && c.type === 'criticism'), 'Criticism direction: Aristotle → Plato');
check(profile.connections.some(c => c.source === 'plato' && c.target === 'plotinus' && c.type === 'development'), 'Reception direction: Plato → Plotinus');
check(!profile.connections.some(c => c.type === 'teaching' && ['plotinus', 'pythagorean', 'pythagoreans', 'parmenides'].some(id => [c.source, c.target].includes(id))), 'Do not assert undocumented personal teaching relationships');
for (const school of profile.schools) references(school, school.id);
if (process.argv.includes('--build')) {
  const route = path.join(root, 'out/philosophers/plato/index.html');
  check(fs.existsSync(route), 'Static export must contain /philosophers/plato/');
  if (fs.existsSync(route)) {
    const html = fs.readFileSync(route, 'utf8');
    check(html.includes('Платон'), 'Exported page must contain Plato in its HTML');
    const visibleMarkup = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
    check(/<h1[^>]*id="plato-title"[^>]*>[\s\S]*?Платон[\s\S]*?<\/h1>/.test(visibleMarkup), 'Exported page must render the Plato heading, not a fallback 404');
  }
}
if (errors.length) {
  console.error(`FAIL: ${errors.length}/${checks} checks failed:\n${errors.map(e => `- ${e}`).join('\n')}`);
  process.exitCode = 1;
} else {
  assert(profile.chapters.length > 0);
  console.log(`PASS: ${checks} integrity checks; ${profile.chapters.length} chapters, ${profile.ideas.length} ideas, ${profile.works.length} books, ${profile.questions.length} conversations, ${profile.connections.length} directed relationships.`);
}
