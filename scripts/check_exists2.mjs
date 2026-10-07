
import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
async function loadEnv() {
  const text = await fs.readFile('.env', 'utf8');
  return Object.fromEntries(
    text.split(/\r?\n/).filter(line => line.includes('=') && !line.trim().startsWith('#'))
      .map(line => { const i = line.indexOf('='); return [line.slice(0, i).trim(), line.slice(i + 1).trim().replace(/^"|"$/g, '')]; })
  );
}
async function run() {
  const env = await loadEnv();
  const db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  
  const slugs = [
    { p: 'false-ceiling', c: 'false-ceiling-projects' },
    { p: 'artificial-grass', c: 'artificial-grass-installations' },
    { p: 'folding-doors', c: 'folding-doors-systems' },
  ];
  
  for (const {p, c} of slugs) {
    const { data: parentCat } = await db.from('categories').select('id, name').eq('slug', p).single();
    const { data: childCat } = await db.from('categories').select('id, name').eq('slug', c).single();
    
    if (!parentCat || !childCat) {
      console.log('Missing cat:', p, c);
      continue;
    }
    
    const { data: prods } = await db.from('products').select('*').eq('category_id', parentCat.id);
    const { data: media } = await db.from('media').select('*').eq('entity_id', childCat.id);
    
    console.log(p, 'Products:', prods?.length, '|', c, 'Media:', media?.length);
  }
}
run();

