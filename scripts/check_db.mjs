
import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';

async function loadEnv() {
  const text = await fs.readFile('.env', 'utf8');
  return Object.fromEntries(
    text
      .split(/\r?\n/)
      .filter((line) => line.includes('=') && !line.trim().startsWith('#'))
      .map((line) => {
        const i = line.indexOf('=');
        return [line.slice(0, i).trim(), line.slice(i + 1).trim().replace(/^"|"$/g, '')];
      })
  );
}

async function run() {
  const env = await loadEnv();
  const db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const { data: cats } = await db.from('categories').select('*');
  console.log('Categories:', cats.map(c => c.slug + ' (parent: ' + c.parent_id + ')').sort());
  
  const targetSlugs = ['false-ceiling', 'window-blinds', 'artificial-grass', 'folding-doors'];
  const targetCats = cats.filter(c => targetSlugs.includes(c.slug));
  console.log('\nTarget categories:', targetCats);
  
  const targetParentIds = targetCats.map(c => c.id);
  const childCats = cats.filter(c => targetParentIds.includes(c.parent_id));
  console.log('\nChild categories:', childCats);
  
  const { data: prods } = await db.from('products').select('*');
  console.log('Products count total:', prods?.length);
  
  const allTargetCatIds = [...targetParentIds, ...childCats.map(c => c.id)];
  const targetProds = prods?.filter(p => allTargetCatIds.includes(p.category_id));
  console.log('Products in target categories:', targetProds?.length);
  if (targetProds?.length > 0) console.log(targetProds[0]);
}
run();

