
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
  
  const { data: parentCat } = await db.from('categories').select('id, name').eq('slug', 'window-blinds').single();
  const { data: childCat } = await db.from('categories').select('id, name').eq('slug', 'roller-blinds-series').single();
  
  const { data: prods } = await db.from('products').select('*').eq('category_id', parentCat.id);
  const { data: media } = await db.from('media').select('*').eq('entity_id', childCat.id);
  
  console.log('Parent Products:', prods?.length);
  console.log('Child Media:', media?.length);
}
run();

