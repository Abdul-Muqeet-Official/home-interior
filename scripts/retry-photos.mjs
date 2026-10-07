import fs from 'node:fs/promises';
const slots = {
  'pvc-wall-panel': ['1586023492125-27b2c045efd7','1616486338812-3dadae4b4ace','1618220179428-22790b461013','1615529182904-14819c35db37','1595428774223-ef52624120d2'],
  '3d-wall-picture': ['1578500494198-246f612d3b3d','1513519245088-0e12902e5a38','1549289524-06cf8837ace5','1586023492125-27b2c045efd7','1526566767986-2d4d1ba93384'],
};
for (const [slot, ids] of Object.entries(slots)) {
  let done = false;
  for (const id of ids) {
    if (done) break;
    const url = `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1600&q=80`;
    try {
      const res = await fetch(url);
      if (!res.ok) { console.log(`${slot} skip ${id} - HTTP ${res.status}`); continue; }
      const type = res.headers.get('content-type') || '';
      if (!type.startsWith('image/')) { console.log(`${slot} skip ${id} - type ${type}`); continue; }
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 40000) { console.log(`${slot} skip ${id} - too small ${buf.length}`); continue; }
      await fs.writeFile(`public/media/photos/${slot}.jpg`, buf);
      console.log(`${slot} <- ${id} ${Math.round(buf.length/1024)}KB`);
      done = true;
    } catch (e) { console.log(`${slot} skip ${id} - ${e.message}`); }
  }
  if (!done) console.log(`${slot} FAILED all candidates`);
}
