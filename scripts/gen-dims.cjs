const sharp = require(process.env.TEMP + '/webpconv/node_modules/sharp');
const fs = require('fs');

(async () => {
  const files = fs.readdirSync('assets/products').filter((f) => /\.webp$/i.test(f)).sort();
  let out = 'const IMG_DIMS={\n';
  for (const f of files) {
    const m = await sharp('assets/products/' + f).metadata();
    out += '"assets/products/' + f + '":[' + m.width + ',' + m.height + '],\n';
  }
  out += '};\n';
  fs.writeFileSync(process.env.TEMP + '/img-dims.js', out);
  console.log('dims entries:', files.length);
})();
