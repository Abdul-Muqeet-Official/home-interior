
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const { data: parent } = await supabase.from('categories').select('id').eq('slug', 'carpet-tile').single();
const { data } = await supabase.from('categories').select('*').eq('parent_id', parent.id);
console.log(data.map(d => ({ name: d.name, image_path: d.image_path })));

