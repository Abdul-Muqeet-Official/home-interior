const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envLocal = fs.readFileSync('.env', 'utf8');
const extract = (key) => {
  const match = envLocal.match(new RegExp(`${key}=(.*)`));
  return match ? match[1].trim() : null;
};

const supabaseUrl = extract('NEXT_PUBLIC_SUPABASE_URL');
const supabaseKey = extract('SUPABASE_SERVICE_ROLE_KEY');

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
  if (children.length > 0) {
    children.forEach(c => console.log(`  - ${c.name} (${c.slug}) parent: ${c.parent_id}`));
  }
  
  const allCatIds = [...rootIds, ...children.map(c => c.id)];
  
  const { data: media } = await supabase.from('media').select('id, category_id').in('category_id', allCatIds);
  console.log(`\nMEDIA ROWS: ${media?.length || 0}`);
  
  const { data: products } = await supabase.from('products').select('id, category_id').in('category_id', allCatIds);
  console.log(`\nPRODUCT ROWS: ${products?.length || 0}`);
}
audit();
