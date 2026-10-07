import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const brandDir = path.resolve('public/brand');
const files = fs.readdirSync(brandDir).filter(f => /^candidate-.*\.(jpe?g|png|webp)$/i.test(f));

async function analyze(file) {
  const src = path.join(brandDir, file);
  const meta = await sharp(src).metadata();
  const width = meta.width || 0, height = meta.height || 0;
  const s = Math.max(12, Math.min(24, Math.floor(Math.min(width, height) / 4)));
  const corners = await Promise.all(
    [[0,0],[Math.max(0,width-s),0],[0,Math.max(0,height-s)],[Math.max(0,width-s),Math.max(0,height-s)]].map(([l,t]) =>
      sharp(src).extract({left:l,top:t,width:s,height:s}).stats()
    )
  );
  const cornerLum = corners.map(c => Math.round((c.channels[0].mean + c.channels[1].mean + c.channels[2].mean) / 3));
  const whiteBg = cornerLum.every(v => v > 225);
  const cw = Math.max(8, Math.floor(width/2)), ch = Math.max(8, Math.floor(height/2));
  const cl = Math.floor((width-cw)/2), ct = Math.floor((height-ch)/2);
  const center = await sharp(src).extract({left:cl,top:ct,width:cw,height:ch}).stats();
  const [r,g,b] = center.channels.map(c => c.mean);
  const goldish = r > 110 && r >= g && g >= b && (r - b) > 15;
  const overall = await sharp(src).stats();
  const sd = overall.channels.slice(0,3).map(c => c.stdev);
  const graphicness = Math.round(255 - (sd[0]+sd[1]+sd[2])/3);
  return { file, width, height, whiteBg, cornerLum, rgb:[Math.round(r),Math.round(g),Math.round(b)], goldish, graphicness };
}

const results = [];
for (const f of files) { try { results.push(await analyze(f)); } catch(e) { results.push({ file:f, error:String(e) }); } }
function score(a){ if (a.error) return -1; let s = 0; if (a.whiteBg) s += 40; if (a.goldish) s += 25; s += (a.graphicness/255)*35; return Math.round(s); }
results.sort((x,y) => score(y) - score(x));
console.log(JSON.stringify(results.map(a => Object.assign({}, a, { score: score(a) })), null, 1));
const best = results.find(a => !a.error);
if (!best || score(best) < 40) { console.error('NO_LOGO_CANDIDATE best score below threshold'); process.exit(2); }

const src = path.join(brandDir, best.file);
let base;
try { base = await sharp(src).trim({ threshold: 12 }).toBuffer(); }
catch { base = await sharp(src).toBuffer(); }
const tm = await sharp(base).metadata();
const pad = Math.round(Math.max(tm.width || 0, tm.height || 0) * 0.05) + 8;
const padded = await sharp(base).extend({ top:pad, bottom:pad, left:pad, right:pad, background:'#ffffff' }).png().toBuffer();
fs.writeFileSync(path.join(brandDir,'logo.png'), padded);
await sharp(padded).webp({ quality: 92 }).toFile(path.join(brandDir,'logo.webp'));
const sq = await sharp(padded).resize(512,512,{ fit:'contain', background:'#ffffff' }).png().toBuffer();
fs.writeFileSync(path.join(brandDir,'icon-512.png'), sq);
await sharp(sq).resize(64,64).png().toFile(path.join(brandDir,'favicon-64.png'));
await sharp(sq).resize(180,180).png().toFile(path.join(brandDir,'apple-icon-180.png'));
console.log('LOGO_OK from', best.file, 'trimmed', tm.width + 'x' + tm.height);
