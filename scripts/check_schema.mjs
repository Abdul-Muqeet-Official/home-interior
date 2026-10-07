
import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
async function loadEnv() {
  const text = await fs.readFile('.env', 'utf8');
  return Object.fromEntries(
    text.split(/\r?\n/).filter((line) => line.includes('=') && !line.trim().startsWith('#'))
      .map((line) => {
        const i = line.indexOf('=');
        return [line.slice(0, i).trim(), line.slice(i + 1).trim().replace(/^"|"$/g, '')];
      })
  );
}
async function run() {
  const env = await loadEnv();
  const db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  console.log('Categories:', (await db.from('categories').select('slug').limit(5)).data);
  const { data: media } = await db.from('media').select('*').limit(1);
  console.log('Media:', media);
  const { data: products } = await db.from('products').select('*').limit(1);
  console.log('Products:', products);
}
run();

