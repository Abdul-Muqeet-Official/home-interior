import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function audit() {
  const slugs = ['false-ceiling', 'gypsum-ceilings', 'roller-blinds', 'window-blinds', 'artificial-grass', 'folding-doors'];
  const { data: roots } = await supabase.from('categories').select('*').in('slug', slugs);
  
  console.log("ROOT CATEGORIES FOUND:");
  roots.forEach(r => console.log(`- ${r.name} (${r.slug}) ID: ${r.id}`));
  
  if (!roots || roots.length === 0) return;
  
  const rootIds = roots.map(r => r.id);
  
  const { data: children } = await supabase.from('categories').select('*').in('parent_id', rootIds);
  console.log(`\nCHILD COLLECTIONS: ${children.length}`);
  
  const allCatIds = [...rootIds, ...children.map(c => c.id)];
  
  const { data: media } = await supabase.from('media').select('category_id, count', { count: 'exact' }).in('category_id', allCatIds);
  console.log(`\nMEDIA ROWS: ${media?.length || 0}`);
  
  const { data: products } = await supabase.from('products').select('category_id, count', { count: 'exact' }).in('category_id', allCatIds);
  console.log(`\nPRODUCT ROWS: ${products?.length || 0}`);
}
audit();
