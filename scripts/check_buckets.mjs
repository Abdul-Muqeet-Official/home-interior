
import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
async function run() {
  const envText = await fs.readFile('.env', 'utf8');
  const env = Object.fromEntries(
    envText.split(/\r?\n/).filter(line => line.includes('=') && !line.trim().startsWith('#'))
      .map(line => { const i = line.indexOf('='); return [line.slice(0, i).trim(), line.slice(i + 1).trim().replace(/^"|"$/g, '')]; })
  );
  const db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const { data } = await db.storage.listBuckets();
  console.log('Buckets:', data?.map(b => b.id));
}
run();

