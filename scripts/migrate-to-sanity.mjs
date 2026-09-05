#!/usr/bin/env node
/*
 * MJ Weaves — one-time migration of the static storefront content into Sanity.
 *
 *   node scripts/migrate-to-sanity.mjs                 # dry-run (default, no writes)
 *   node scripts/migrate-to-sanity.mjs --commit        # uploads + creates docs
 *   node --env-file=.env.local scripts/migrate-to-sanity.mjs --commit
 *
 * Reads (local, no secrets needed):
 *   products.json        -> 22 product docs (photo upload per product)
 *   index.html           -> 3 testimonials, 6 FAQs, shipping/care bullets,
 *                           current WHATSAPP_NUMBER + INSTAGRAM_URL
 *
 * Needs for --commit (env or flags):
 *   SANITY_PROJECT_ID / --project=…        (e.g. abc123xy)
 *   SANITY_DATASET    / --dataset=…        (default: production)
 *   SANITY_API_WRITE_TOKEN / --token=…     (Editor role token, never commit it)
 *
 * Writes (only with --commit): image assets + createOrReplace mutations with
 * stable _ids (product-p01…), so the script is safe to re-run.
 */
import {readFileSync, existsSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const COMMIT = args.includes('--commit');
const getArg = (k, d) => {
  const a = args.find((x) => x.startsWith(k + '='));
  return a ? a.slice(k.length + 1) : d;
};

// --- tiny .env.local loader (no dependencies) ---
function loadDotEnv() {
  let raw;
  try {
    raw = readFileSync(join(ROOT, '.env.local'), 'utf8');
  } catch {
    return;
  }
  for (const line of raw.split(/\r?\n/)) {
    const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(line);
    if (!m || process.env[m[1]] !== undefined) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    process.env[m[1]] = v;
  }
}
loadDotEnv();

const PROJECT_ID = getArg('--project', process.env.SANITY_PROJECT_ID || '');
const DATASET = getArg('--dataset', process.env.SANITY_DATASET || 'production');
const TOKEN = getArg('--token', process.env.SANITY_API_WRITE_TOKEN || '');
const API = PROJECT_ID ? `https://${PROJECT_ID}.api.sanity.io/v2025-01-01` : '';

const fail = (msg) => {
  console.error('ERROR: ' + msg);
  process.exit(1);
};

// --- load + validate products ---
let products;
try {
  products = JSON.parse(readFileSync(join(ROOT, 'products.json'), 'utf8'));
} catch (e) {
  fail('cannot read products.json: ' + e.message);
}
if (!Array.isArray(products) || products.length === 0) fail('products.json is empty');
for (const p of products) {
  for (const k of ['id', 'img', 'title', 'color', 'price']) {
    if (p[k] === undefined || p[k] === null || p[k] === '') fail(`product ${JSON.stringify(p.id)} missing "${k}"`);
  }
  if (!existsSync(join(ROOT, p.img))) fail(`missing image file for ${p.id}: ${p.img}`);
}

// --- extract page content from index.html ---
const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
const unesc = (s) =>
  String(s)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const quotes = [...html.matchAll(/<blockquote>([\s\S]*?)<\/blockquote>/g)].map((m) => unesc(m[1]));
const whos = [...html.matchAll(/<div class="who">[\s\S]*?<b>([^<]+)<\/b><span>([^<]+)<\/span>/g)].map((m) => ({
  name: unesc(m[1]),
  meta: unesc(m[2]),
}));
const faqs = [
  ...html.matchAll(
    /<button aria-expanded="false">\s*([^<]+?)\s*<svg[\s\S]*?<div class="qa-body"><p>([\s\S]*?)<\/p>/g
  ),
].map((m) => ({question: unesc(m[1]), answer: unesc(m[2])}));

function bulletsFor(heading) {
  const sec = new RegExp('<h3>' + heading + '<\\/h3>[\\s\\S]*?<ul>([\\s\\S]*?)<\\/ul>').exec(html);
  if (!sec) return [];
  return [...sec[1].matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => unesc(m[1]));
}
const shippingBullets = bulletsFor('Shipping &amp; Delivery');
const careBullets = bulletsFor('Looking After Your Saree');

const wa = /const WHATSAPP_NUMBER = "([^"]+)"/.exec(html);
const ig = /const INSTAGRAM_URL = "([^"]+)"/.exec(html);

if (quotes.length !== 3 || whos.length !== 3) fail(`expected 3 reviews, found ${quotes.length} quotes / ${whos.length} authors`);
if (faqs.length !== 6) fail(`expected 6 FAQs, found ${faqs.length}`);
if (shippingBullets.length !== 4) fail(`expected 4 shipping bullets, found ${shippingBullets.length}`);
if (careBullets.length !== 4) fail(`expected 4 care bullets, found ${careBullets.length}`);
if (!wa || !ig) fail('could not find WHATSAPP_NUMBER / INSTAGRAM_URL in index.html');

// --- build mutations ---
const mutations = [];
const uploads = products.map((p) => ({id: p.id, file: p.img, filename: p.id + '.jpg'}));

for (const p of products) {
  mutations.push({
    createOrReplace: {
      _id: 'product-' + p.id,
      _type: 'product',
      code: p.id,
      name: p.title,
      photo: {_type: 'image', asset: {_type: 'reference', _ref: `__ASSET_${p.id}__`}},
      shade: p.color,
      shadeHex: p.hex || '#B8892B',
      price: p.price,
      description: p.desc || '',
      status: p.soldOut ? 'sold-out' : 'in-stock',
      featured: false,
      category: p.category || '',
      kind: p.kind || 'saree',
      ...(p.sizes && p.sizes.length ? {sizes: p.sizes} : {}),
      ...(p.shipping ? {shipping: p.shipping} : {}),
    },
  });
}
quotes.forEach((text, i) => {
  const [location, ...rest] = (whos[i].meta || '').split('·').map((s) => s.trim());
  mutations.push({
    createOrReplace: {
      _id: 'testimonial-' + (i + 1),
      _type: 'testimonial',
      name: whos[i].name,
      location: location || '',
      context: rest.join(' · '),
      text,
      rating: 5,
    },
  });
});
faqs.forEach((f, i) => {
  mutations.push({
    createOrReplace: {
      _id: 'faq-' + (i + 1),
      _type: 'faq',
      question: f.question,
      answer: f.answer,
      category: 'general',
    },
  });
});
mutations.push({
  createOrReplace: {
    _id: 'siteSettings',
    _type: 'siteSettings',
    whatsappNumber: wa[1],
    instagramUrl: ig[1],
    shippingPoints: shippingBullets,
    carePoints: careBullets,
  },
});

// --- dry-run report ---
console.log(`\nMJ Weaves → Sanity migration (${COMMIT ? 'COMMIT' : 'DRY-RUN'})`);
console.log(`  target: ${PROJECT_ID || '(no project id yet)'}/${DATASET}`);
console.log(`  products: ${products.length} (${products.filter((p) => p.soldOut).map((p) => p.id).join(', ') || 'none'} sold-out)`);
console.log(`  image uploads: ${uploads.length}`);
console.log(`  docs: ${products.length} products + ${quotes.length} testimonials + ${faqs.length} faqs + 1 siteSettings = ${mutations.length}`);
console.log('  sample product doc:', JSON.stringify(mutations[0].createOrReplace, null, 1).slice(0, 600) + '…');

if (!COMMIT) {
  console.log('\nDry-run only — nothing was written. Re-run with --commit to migrate.\n');
  process.exit(0);
}

// --- commit ---
if (!PROJECT_ID) fail('set SANITY_PROJECT_ID (or --project=…) before --commit');
if (!TOKEN) fail('set SANITY_API_WRITE_TOKEN (or --token=…) before --commit');

async function api(path, opts) {
  const res = await fetch(API + path, {
    ...(opts || {}),
    headers: {Authorization: 'Bearer ' + TOKEN, ...(opts && opts.headers ? opts.headers : {})},
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) fail(`Sanity API ${res.status}: ${data.message || JSON.stringify(data).slice(0, 300)}`);
  return data;
}

console.log('\nUploading images…');
const assetIds = {};
for (const u of uploads) {
  const buf = readFileSync(join(ROOT, u.file));
  const up = await api(`/assets/images/${DATASET}?filename=${encodeURIComponent(u.filename)}`, {
    method: 'POST',
    headers: {'Content-Type': 'image/jpeg'},
    body: buf,
  });
  assetIds[u.id] = up.document._id;
  console.log(`  ${u.id} -> ${up.document._id}`);
}

console.log('Creating docs…');
const body = JSON.stringify({
  mutations: mutations.map((m) => {
    const doc = JSON.parse(JSON.stringify(m.createOrReplace));
    if (doc.photo && doc.photo.asset._ref.startsWith('__ASSET_')) {
      const pid = doc.photo.asset._ref.replace('__ASSET_', '').replace('__', '');
      doc.photo.asset._ref = assetIds[pid];
    }
    return {createOrReplace: doc};
  }),
});
const out = await api(`/data/mutate/${DATASET}`, {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body,
});
console.log(`  committed ${(out.results || []).length} docs (transaction ${out.transactionId})`);
console.log('\nDone. Publish-free reads work immediately; open Studio to edit.\n');
