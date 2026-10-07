import fs from 'fs/promises';
import { createClient } from '@supabase/supabase-js';

async function run() {
  const envContent = await fs.readFile('.env', 'utf-8');
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
  const keyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/) || envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);
  
  if (!urlMatch || !keyMatch) {
    console.error("Missing Supabase credentials in .env");
    process.exit(1);
  }
  const supabase = createClient(urlMatch[1].trim(), keyMatch[1].trim());

  const { data } = await supabase.from('categories').select('id, slug, parent_id').eq('parent_id', (await supabase.from('categories').select('id').eq('slug', 'laminate-flooring').single()).data.id);
  console.log('Laminate Flooring Collections in DB:', data?.length ?? 0);
  
  const { data: mediaData } = await supabase.from('media').select('id').eq('bucket', 'laminate-flooring');
  console.log('Laminate Flooring Media in DB:', mediaData?.length ?? 0);
}
run().catch(console.error);
