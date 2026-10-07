import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
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

  const SOURCE_DIR = 'C:/Users/DELL/Pictures/Cover Photo';
  const BUCKET = 'site-assets';
  
  const SLUG_MAP = {
    '3d wall pictures images.jfif': '3d-wall-picture',
    'carpet tiles images.jfif': 'carpet-tile',
    'Folding Door images.jfif': 'folding-doors',
    'LaminateFlooringimages.jfif': 'laminate-flooring',
    'PVC Wall Panel images.jfif': 'pvc-wall-panels',
    'spc flooring images.jfif': 'spc-flooring',
    'vinyl flooring.webp': 'vinyl-flooring',
    'Wallpaper images.jfif': 'wallpaper',
    'window bliunds images.jfif': 'window-blinds'
  };

  const files = await fs.readdir(SOURCE_DIR);
  
  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    
    const slug = SLUG_MAP[file];
    if (!slug) {
      console.log(`No slug mapped for ${file}`);
      continue;
    }
    
    const sourcePath = path.join(SOURCE_DIR, file);
    const buffer = await fs.readFile(sourcePath);
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');
    
    const { data: category } = await supabase.from('categories').select('id').eq('slug', slug).single();
    if (!category) {
      console.log(`Category not found in DB for ${slug}`);
      continue;
    }
    
    let mime = 'image/jpeg';
    let newExt = '.jpg';
    if (ext === '.webp') { mime = 'image/webp'; newExt = '.webp'; }
    if (ext === '.png') { mime = 'image/png'; newExt = '.png'; }
    
    const imagePath = `covers/${slug}-${hash.slice(0, 8)}${newExt}`;
      
    console.log(`Uploading ${imagePath}...`);
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(imagePath, buffer, { contentType: mime, upsert: true });
      
    if (uploadError) {
      console.error(`Error uploading ${file}:`, uploadError);
      continue;
    }
    
    console.log(`Updating category ${slug}...`);
    await supabase.from('categories')
      .update({ image_path: imagePath })
      .eq('id', category.id);
      
    console.log(`Done processing ${file}`);
  }
}
run().catch(console.error);
