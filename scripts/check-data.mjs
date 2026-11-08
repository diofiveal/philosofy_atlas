/** Validate editorial data and cross-links without needing a running browser. */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';

const root = path.resolve(import.meta.dirname, '..');
const nativeRequire = createRequire(import.meta.url);
const cache = new Map();
function loadTs(file) {
  const filename = path.resolve(file);
  if (cache.has(filename)) return cache.get(filename).exports;
  if (!fs.existsSync(filename)) throw new Error(`Missing content file: ${path.relative(root, filename)}`);
  const source = fs.readFileSync(filename, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS },
    fileName: filename,
    reportDiagnostics: true,
  });
  const syntaxErrors = output.diagnostics?.filter(d => d.category === ts.DiagnosticCategory.Error) ?? [];
  if (syntaxErrors.length) throw new Error(ts.formatDiagnosticsWithColorAndContext(syntaxErrors, {
    getCurrentDirectory: () => root, getCanonicalFileName: f => f, getNewLine: () => '\n',
  }));
  const module = { exports: {} };
  cache.set(filename, module);
  const localRequire = specifier => {
    if (!specifier.startsWith('.')) return nativeRequire(specifier);
    const candidate = path.resolve(path.dirname(filename), specifier);
    return loadTs(candidate.endsWith('.ts') ? candidate : `${candidate}.ts`);
  };
  const execute = vm.runInThisContext(`(function(exports, require, module) {\n${output.outputText}\n})`, { filename });
  execute(module.exports, localRequire, module);
  return module.exports;
}

try {
  const { philosophers } = loadTs(path.join(root, 'src/data/philosophers.ts'));
  const { EPOCHS, TOPICS } = loadTs(path.join(root, 'src/data/types.ts'));
  const errors = [];
  const check = (condition, message) => { if (!condition) errors.push(message); };
  const nonempty = value => typeof value === 'string' && value.trim().length > 0;
  check(Array.isArray(philosophers), 'philosophers must be an array');
  if (!Array.isArray(philosophers)) throw new Error(errors.join('\n'));
  check(philosophers.length >= 20, `Expected at least 20 philosophers; received ${philosophers.length}`);
  const ids = new Set(philosophers.map(p => p.id));
  check(ids.size === philosophers.length, 'Philosopher IDs must be unique');
  const epochIds = new Set(EPOCHS.map(e => e.id));
  const topicIds = new Set(TOPICS.map(t => t.id));
  check(topicIds.size === 6, 'Expected exactly six distinct philosophical topics');
  for (const philosopher of philosophers) {
    const prefix = philosopher.id || '[missing id]';
    for (const field of ['id', 'name', 'latinName', 'dates', 'tradition', 'summary', 'bio']) {
      check(nonempty(philosopher[field]), `${prefix}: ${field} must be nonempty`);
    }
    check(/^[a-z][a-z0-9-]*$/.test(philosopher.id ?? ''), `${prefix}: ID must be a URL-safe slug`);
    const hasUnknownDates = philosopher.birthYear === null || philosopher.deathYear === null;
    check(hasUnknownDates
      ? philosopher.birthYear === null && philosopher.deathYear === null && /спор|неизвест|не установлен|нет достовер|традици|неопредел/i.test(philosopher.dates)
      : Number.isFinite(philosopher.birthYear) && Number.isFinite(philosopher.deathYear) && philosopher.birthYear < philosopher.deathYear,
    `${prefix}: known birthYear must precede deathYear; unknown dates require nulls and an editorial caveat`);
    check(epochIds.has(philosopher.epoch), `${prefix}: unknown epoch ${philosopher.epoch}`);
    check(Array.isArray(philosopher.schools) && philosopher.schools.length > 0
      && philosopher.schools.every(nonempty), `${prefix}: schools must be nonempty strings`);
    check(Array.isArray(philosopher.tags) && philosopher.tags.length > 0
      && philosopher.tags.every(tag => topicIds.has(tag)), `${prefix}: tags must use known topics`);
    for (const topic of topicIds) {
      check(nonempty(philosopher.positions?.[topic]), `${prefix}: missing position for ${topic}`);
    }
    check(Object.keys(philosopher.positions ?? {}).every(topic => topicIds.has(topic)), `${prefix}: unknown position topic`);
    check(Array.isArray(philosopher.ideas) && philosopher.ideas.length >= 3, `${prefix}: expected at least three ideas`);
    for (const [index, idea] of (philosopher.ideas ?? []).entries()) {
      check(nonempty(idea.title) && nonempty(idea.explanation), `${prefix}: idea ${index + 1} is incomplete`);
      check(idea.status === undefined || ['fact', 'explanation', 'interpretation'].includes(idea.status), `${prefix}: invalid idea status`);
    }
    const works = philosopher.works ?? [];
    check(Array.isArray(works) && works.length >= 1, `${prefix}: works require at least one entry or an explanatory Socrates note`);
    for (const work of works) check(nonempty(work.title), `${prefix}: work title is empty`);
    if (prefix === 'socrates') {
      const explanatoryText = philosopher.bio + ' ' + works.map(work => `${work.title} ${work.note ?? ''}`).join(' ');
      check(/не (писал|оставил|сохранил|сочинение)|собственных|нет|устн|сочинений/i.test(explanatoryText), 'socrates: explain the absence of his own writings');
    }
    check(Array.isArray(philosopher.sources) && philosopher.sources.length >= 1, `${prefix}: at least one source is required`);
    for (const source of philosopher.sources ?? []) {
      check(nonempty(source.title), `${prefix}: source needs a title`);
      let isHttps = false;
      try { isHttps = new URL(source.url).protocol === 'https:'; } catch { /* Report below. */ }
      check(isHttps, `${prefix}: source URL must be a valid HTTPS URL: ${source.url}`);
    }
    for (const relation of philosopher.relationships ?? []) {
      check(ids.has(relation.targetId), `${prefix}: missing relationship target ${relation.targetId}`);
      check(relation.targetId !== philosopher.id, `${prefix}: self-relationship is not allowed`);
      check(['influence', 'contrast', 'affinity'].includes(relation.type), `${prefix}: unknown relationship type ${relation.type}`);
      check(nonempty(relation.label), `${prefix}: relationship needs an explanatory label`);
    }
  }
  if (errors.length) throw new Error(`${errors.length} content validation error(s):\n${errors.map(error => `- ${error}`).join('\n')}`);
  const ideas = philosophers.reduce((total, p) => total + p.ideas.length, 0);
  const relationships = philosophers.reduce((total, p) => total + (p.relationships?.length ?? 0), 0);
  const sourceLinks = philosophers.reduce((total, p) => total + p.sources.length, 0);
  console.log(`PASS: ${philosophers.length} philosophers, ${ideas} ideas, ${topicIds.size} topics, ${relationships} valid relationships, ${sourceLinks} source links.`);
  console.log('Checks: unique IDs, years, required text, epochs, schools, tags, positions, ideas, works, HTTPS sources and relationship integrity.');
} catch (error) {
  console.error(`FAIL: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
