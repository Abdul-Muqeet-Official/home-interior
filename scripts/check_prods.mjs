
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
  const { data: p } = await db.from('products').select('*').limit(1);
  console.log('Product row keys:', Object.keys(p[0] || {}));
}
run();

