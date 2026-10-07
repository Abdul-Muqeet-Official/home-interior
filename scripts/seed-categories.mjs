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

  const CATEGORIES = [
    { name: '3D Wall Picture', slug: '3d-wall-picture' },
    { name: 'Folding Doors', slug: 'folding-doors' },
    { name: 'PVC Wall Panels', slug: 'pvc-wall-panels' },
    { name: 'SPC Flooring', slug: 'spc-flooring' },
    { name: 'Vinyl Flooring', slug: 'vinyl-flooring' },
    { name: 'Window Blinds', slug: 'window-blinds' },
    { name: 'False Ceiling', slug: 'false-ceiling' },
    { name: 'Artificial Grass', slug: 'artificial-grass' }
  ];

  for (const cat of CATEGORIES) {
    const { data: existing } = await supabase.from('categories').select('id').eq('slug', cat.slug).single();
    if (!existing) {
      console.log(`Inserting ${cat.slug}...`);
      const { error } = await supabase.from('categories').insert({ name: cat.name, slug: cat.slug, is_active: true });
      if (error) console.error(`Error inserting ${cat.slug}:`, error);
    }
  }
}
run().catch(console.error);
