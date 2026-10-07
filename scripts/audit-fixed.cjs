const { createClient } = require("@supabase/supabase-js");
const fs = require("node:fs");

const envLocal = fs.readFileSync(".env", "utf8");
const extract = (key) => {
  const match = envLocal.match(new RegExp(`${key}=(.*)`));
  return match ? match[1].trim() : null;
};
const supabase = createClient(extract("NEXT_PUBLIC_SUPABASE_URL"), extract("SUPABASE_SERVICE_ROLE_KEY"));

async function audit() {
  const slugs = ['false-ceiling', 'gypsum-ceilings', 'roller-blinds', 'window-blinds', 'artificial-grass', 'folding-doors'];
  const { data: roots } = await supabase.from('categories').select('*').in('slug', slugs);
  
  if (!roots || roots.length === 0) return;
  const rootIds = roots.map(r => r.id);
  const { data: children } = await supabase.from('categories').select('*').in('parent_id', rootIds);
  const allCatIds = [...rootIds, ...children.map(c => c.id)];
  
  const { data: media, error } = await supabase.from('media').select('id, entity_id').in('entity_id', allCatIds).eq('entity_type', 'category');
  if (error) console.error(error);
  console.log(`\nMEDIA ROWS: ${media?.length || 0}`);
  
  const { data: products } = await supabase.from('products').select('id, category_id').in('category_id', allCatIds);
  console.log(`\nPRODUCT ROWS: ${products?.length || 0}`);
}
audit();
