import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const site = path.join(root, 'dist');
const html = fs.readFileSync(path.join(site, 'index.html'), 'utf8').replace(/<!--[\s\S]*?-->/g, '');
const css = fs.readFileSync(path.join(site, 'assets/style.css'), 'utf8');
const dataSource = fs.readFileSync(path.join(site, 'assets/content.js'), 'utf8');
const mainSource = fs.readFileSync(path.join(site, 'assets/main.js'), 'utf8');
new vm.Script(mainSource);
new vm.Script(fs.readFileSync(path.join(site, 'assets/i18n.js'), 'utf8'));
const context = { window: {} };
vm.runInNewContext(dataSource, context);
const data = context.window.WORLD_DREAMER;
const localPaths = new Set();
function asset(value) {
  if (!value || /^(https?:|data:)/.test(value)) return;
  assert(!value.startsWith('/'), `Use relative paths for GitHub project pages: ${value}`);
  const location = path.resolve(site, value.split(/[?#]/)[0]);
  assert(location.startsWith(site + path.sep), `Asset escapes site folder: ${value}`);
  assert(fs.existsSync(location), `Missing asset: ${value}`);
  assert(fs.statSync(location).size > 0, `Empty asset: ${value}`);
  localPaths.add(location);
}
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert.equal(ids.length, new Set(ids).size, 'Duplicate HTML IDs');
for (const match of html.matchAll(/\b(?:src|href)="([^"]+)"/g)) {
  if (match[1].startsWith('#')) assert(ids.includes(match[1].slice(1)), `Missing navigation target: ${match[1]}`);
  else asset(match[1]);
}
const taskIds = new Set();
for (const task of [...data.simulation, ...data.realWorld]) {
  assert(task.id && !taskIds.has(task.id), `Duplicate or missing task ID: ${task.id}`); taskIds.add(task.id);
  assert(task.title, 'Task title is required'); asset(task.src); asset(task.previewSrc); asset(task.poster);
  if (task.previewSrc) assert(task.src, 'A preview needs a complete demonstration source');
  if (task.views) assert(Number.isInteger(task.views) && task.views > 0, 'views must be a positive integer');
}
for (const link of Object.values(data.resources)) if (link) assert.equal(new URL(link).protocol, 'https:', 'Released resources should use HTTPS');
asset(data.architecture.src); asset(data.results.image);
if (data.results.table) {
  const { columns, rows } = data.results.table;
  assert(columns.length > 0 && rows.length > 0, 'Result table cannot be empty');
  rows.forEach(row => assert.equal(row.length, columns.length, 'Result table column count mismatch'));
}
assert(html.includes("The world’s first open‑source unified World‑Action Model (WAM) for multi‑robot collaborative control."));
assert(html.includes('name="viewport"'));
assert.equal((css.match(/{/g) || []).length, (css.match(/}/g) || []).length, 'Unbalanced CSS blocks');
assert(css.includes('prefers-reduced-motion'));
console.log(`Validated: ${taskIds.size} task entries, ${localPaths.size} local assets, navigation targets, resource URLs, results schema, JavaScript syntax and CSS blocks.`);
