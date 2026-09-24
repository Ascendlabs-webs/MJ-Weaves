#!/usr/bin/env node
/*
 * Regenerate derived artifacts from products.json — run after editing it:
 *   node scripts/sync-fallback.mjs
 *   1. FALLBACK_PRODUCTS array in app.js (offline backup, soldOut baked in)
 *   2. Full ItemList JSON-LD in index.html (all products, for rich results)
 *   3. <noscript> product list in index.html (crawlable catalog text)
 *   4. sitemap.xml (homepage + per-product image entries for image search)
 */
import {readFileSync, writeFileSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://mjweaves.com';
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

// ---------- 2 + 3 + 4: SEO artifacts in index.html + sitemap.xml ----------
const escXml = (s) =>
  String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const itemList = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'MJ Weaves Collection',
  numberOfItems: products.length,
  itemListElement: products.map((p, i) => {
    const item = {
      '@type': 'Product',
      name: p.title,
      image: [SITE + '/' + p.img],
      offers: {
        '@type': 'Offer',
        price: String(p.price),
        priceCurrency: 'INR',
        availability: 'https://schema.org/' + (p.soldOut ? 'SoldOut' : 'InStock'),
      },
    };
    if (p.category) item.category = p.category;
    if (p.desc) item.description = p.desc;
    return {'@type': 'ListItem', position: i + 1, item};
  }),
};

let page = readFileSync(join(ROOT, 'index.html'), 'utf8');
const ldRe = /(<!-- ITEMLIST-JSONLD-START -->\r?\n)([\s\S]*?)(\r?\n?<!-- ITEMLIST-JSONLD-END -->)/;
if (!ldRe.test(page)) {
  console.error('ERROR: ITEMLIST-JSONLD markers not found in index.html');
  process.exit(1);
}
page = page.replace(
  ldRe,
  (m, a) => a + '<script type="application/ld+json">\n' + JSON.stringify(itemList) + '\n</script>\n<!-- ITEMLIST-JSONLD-END -->'
);

const nos = products
  .map(
    (p) =>
      `<a href="${SITE}/#collection">${escXml(p.title)} — ${escXml(p.category || 'Sarees')} — Rs.${p.price}</a>`
  )
  .join('<br>\n    ');
const nosRe = /(<!-- PRODUCTS-NOSCRIPT-START -->\r?\n)([\s\S]*?)(\r?\n?    <!-- PRODUCTS-NOSCRIPT-END -->)/;
if (!nosRe.test(page)) {
  console.error('ERROR: PRODUCTS-NOSCRIPT markers not found in index.html');
  process.exit(1);
}
page = page.replace(nosRe, (m, a) => a + '    ' + nos + '\n    <!-- PRODUCTS-NOSCRIPT-END -->');
writeFileSync(join(ROOT, 'index.html'), page);
console.log('seo: ItemList JSON-LD (' + products.length + ' items) + noscript catalog written');

const today = new Date().toISOString().slice(0, 10);
const sm =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n' +
  '  <url>\n' +
  '    <loc>' + SITE + '/</loc>\n' +
  '    <lastmod>' + today + '</lastmod>\n' +
  '    <changefreq>weekly</changefreq>\n' +
  '    <priority>1.0</priority>\n' +
  products
    .map(
      (p) =>
        '    <image:image>\n' +
        '      <image:loc>' + SITE + '/' + p.img + '</image:loc>\n' +
        '      <image:title>' + escXml(p.title) + '</image:title>\n' +
        '      <image:caption>' + escXml((p.category || 'Sarees') + ' — Rs.' + p.price) + '</image:caption>\n' +
        '    </image:image>'
    )
    .join('\n') +
  '\n  </url>\n</urlset>\n';
writeFileSync(join(ROOT, 'sitemap.xml'), sm);
console.log('seo: sitemap.xml with ' + products.length + ' image entries written');
