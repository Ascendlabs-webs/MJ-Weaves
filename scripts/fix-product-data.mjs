// One-off: unique descriptions for duplicated groups + webp image paths (keeps p01.jpg for OG).
import { readFileSync, writeFileSync } from 'node:fs';
const p = JSON.parse(readFileSync('products.json', 'utf8'));

const D = {
  p23: "Teal Vatican-silk co-ord set with a clean straight silhouette — 43in top, 39in bottom. Clearance at Rs.599 + shipping.",
  p24: "Soft-pink Vatican-silk co-ord set with an easy day-wear fall — 43in top, 39in bottom. Clearance Rs.599 + shipping.",
  p25: "A deeper pink take on the Vatican-silk co-ord — same 43in top and 39in bottom, made for travel days. Clearance Rs.599 + shipping.",
  p26: "Fresh-green Vatican-silk co-ord set that dresses up with gold jewellery — 43in top, 39in bottom. Clearance Rs.599 + shipping.",
  p27: "Rich maroon Vatican-silk co-ord set, festive without trying — 43in top, 39in bottom. Clearance Rs.599 + shipping.",
  p28: "Third pink colourway of the Vatican-silk co-ord in a warmer undertone — 43in top, 39in bottom. Clearance Rs.599 + shipping.",
  p29: "Classic blue Vatican-silk co-ord set, the workhorse of the rack — 43in top, 39in bottom. Clearance Rs.599 + shipping.",
  p30: "Pink Dabu-cotton three-piece set with yoke and sleeve detailing, Kota checks dupatta — 43in top, 39in straight pant. Rs.1050, free shipping.",
  p31: "Warm gold Dabu-cotton set, festive-ready with its Kota checks dupatta — 43in top, 39in pant. Rs.1050, free shipping.",
  p32: "Deep maroon Dabu-cotton three-piece with worked yoke, paired with a Kota checks dupatta — 43in top, 39in pant. Rs.1050, free shipping.",
  p33: "Indigo-blue Dabu-cotton set for daily wear that still looks put-together — Kota checks dupatta, 43in top, 39in pant. Rs.1050, free shipping.",
  p34: "Second gold colourway in Dabu cotton with denser yoke work — Kota checks dupatta, 43in top, 39in pant. Rs.1050, free shipping.",
  p35: "Leaf-green Dabu-cotton three-piece, cool and breathable with a Kota checks dupatta — 43in top, 39in pant. Rs.1050, free shipping.",
  p36: "Everyday blue kurti three-piece with matching bottom and dupatta — office-proof comfort at Rs.350 + shipping.",
  p37: "Festive gold kurti set with coordinated bottom and dupatta — an easy pooja-morning pick at Rs.350 + shipping.",
  p38: "Maroon kurti three-piece, rich colour with matching bottom and dupatta — Rs.350 + shipping.",
  p39: "Teal kurti set that pairs well with silver — matching bottom and dupatta included. Rs.350 + shipping.",
  p40: "A second maroon kurti colourway with a different neckline finish — bottom and dupatta matched. Rs.350 + shipping.",
  p41: "Green kurti three-piece, fresh and simple with matching bottom and dupatta — Rs.350 + shipping.",
  p42: "Cheerful pink kurti set with matching bottom and dupatta — college-and-errands friendly. Rs.350 + shipping.",
  p43: "Deeper gold kurti colourway with matching bottom and dupatta — subtle sheen for evenings. Rs.350 + shipping.",
  p78: "Gold rayon Anarkali with a 44–45in flare that moves beautifully — Rs.699 + shipping. Limited pieces.",
  p79: "Second gold Anarkali colourway on a warmer base — 44–45in length. Rs.699 + shipping, limited pieces.",
  p80: "Antique-toned gold Anarkali, the dressiest of the three — 44–45in. Rs.699 + shipping, limited pieces.",
  p81: "Maroon rayon Anarkali for festive evenings — 44–45in flare. Rs.699 + shipping, limited pieces.",
};

let n = 0;
for (const item of p) {
  if (item.id !== 'p01' && /\.jpe?g$/i.test(item.img || '')) {
    item.img = item.img.replace(/\.jpe?g$/i, '.webp');
    n++;
  }
  if (D[item.id]) item.desc = D[item.id];
}
// Clean the typo-ridden p22 entry (keep meaning + price)
const p22 = p.find((x) => x.id === 'p22');
if (p22) {
  p22.title = 'Samuthrika Vasthrakala Wedding Kanjivaram';
  p22.desc = 'Samuthrika and Vasthrakala style wedding Kanjivaram in blue — grand all-over zari buttas with contrast border, pallu and blouse. Rs.1550 + shipping.';
}
writeFileSync('products.json', JSON.stringify(p, null, 2) + '\n');
console.log('webp-swapped:', n, '| descs rewritten:', Object.keys(D).length + 1);
