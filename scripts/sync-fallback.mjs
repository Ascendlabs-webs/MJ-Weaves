#!/usr/bin/env node
/*
 * Regenerate the FALLBACK_PRODUCTS array in app.js from products.json.
 * Run after editing products.json:  node scripts/sync-fallback.mjs
 * The soldOut flags live in products.json (baked into the array); the old
 * .find() flag lines in app.js are not needed.
 */
import {readFileSync, writeFileSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const products = JSON.parse(readFileSync(join(ROOT, 'products.json'), 'utf8'));

const esc = (s) =>
  String(s == null ? '' : s)
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
const line = (p) => {
  let s = `    { id:"${p.id}", img:"${p.img}", title:"${esc(p.title)}", color:"${p.color}", hex:"${p.hex}", price:${p.price}, desc:"${esc(p.desc)}", category:"${esc(p.category || '')}", kind:"${p.kind || 'saree'}"`;
  if (p.sizes && p.sizes.length) s += `, sizes:[${p.sizes.map((x) => `"${esc(x)}"`).join(',')}]`;
  if (p.shipping) s += `, shipping:"${esc(p.shipping)}"`;
  if (p.soldOut) s += ', soldOut:true';
  return s + ' },';
};

let html = readFileSync(join(ROOT, 'app.js'), 'utf8');
const eolProbe = /const FALLBACK_PRODUCTS = \[(\r?\n)/.exec(html);
const eol = eolProbe ? eolProbe[1] : '\n';
const re = /(const FALLBACK_PRODUCTS = \[\r?\n)([\s\S]*?)(\r?\n\];)/;
if (!re.test(html)) {
  console.error('ERROR: FALLBACK_PRODUCTS block not found in app.js');
  process.exit(1);
}
html = html.replace(re, (m, a, b, c) => a + products.map(line).join(eol) + c);
writeFileSync(join(ROOT, 'app.js'), html);
console.log('fallback synced: ' + products.length + ' products');
