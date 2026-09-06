// One-off: extract inline <style> and main inline <script> from index.html
// into styles.css / app.js (prepends IMG_DIMS map). Keeps JSON-LD inline.
const fs = require('fs');
const path = require('path');
const ROOT = __dirname + '/..';

let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

// 1. CSS
const cssMatch = html.match(/<style>([\s\S]*?)<\/style>/);
if (!cssMatch) throw new Error('style block not found');
fs.writeFileSync(path.join(ROOT, 'styles.css'), cssMatch[1].trim() + '\n');
html = html.replace(cssMatch[0], '<link rel="stylesheet" href="styles.css">');
console.log('styles.css bytes:', cssMatch[1].length);

// 2. JS (the exact <script> block without attributes — JSON-LD has type= so it's skipped)
const jsMatch = html.match(/<script>([\s\S]*)<\/script>/);
if (!jsMatch) throw new Error('app script block not found');
const dims = fs.readFileSync(require('os').tmpdir() + '/img-dims.js', 'utf8');
fs.writeFileSync(path.join(ROOT, 'app.js'), dims + '\n' + jsMatch[1].trim() + '\n');
html = html.replace(jsMatch[0], '<script src="app.js" defer></script>');
console.log('app.js written');

fs.writeFileSync(path.join(ROOT, 'index.html'), html);
console.log('index.html bytes now:', html.length);
