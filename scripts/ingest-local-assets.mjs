import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const DIRS = [
  { parentSlug: 'false-ceiling', childSlug: 'false-ceiling-projects', dir: 'C:\\Users\\DELL\\Pictures\\False ceiling', namePrefix: 'False Ceiling Project' },
  { parentSlug: 'window-blinds', childSlug: 'roller-blinds-series', dir: 'C:\\Users\\DELL\\Pictures\\Roller blinds', namePrefix: 'Roller Blinds Series' },
  { parentSlug: 'artificial-grass', childSlug: 'artificial-grass-installations', dir: 'C:\\Users\\DELL\\Pictures\\Artificial grass', namePrefix: 'Artificial Grass Install' },
  { parentSlug: 'folding-doors', childSlug: 'folding-doors-systems', dir: 'C:\\Users\\DELL\\Pictures\\Folding Door', namePrefix: 'Folding Door System' },
];

const BUCKET = 'site-assets';

function hash(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

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
  
  for (const { parentSlug, childSlug, dir, namePrefix } of DIRS) {
    console.log(`\n--- Processing ${parentSlug} ---`);
    
    // Get Categories
    const { data: parentCat } = await db.from('categories').select('*').eq('slug', parentSlug).single();
    const { data: childCat } = await db.from('categories').select('*').eq('slug', childSlug).single();
    if (!parentCat || !childCat) {
      console.log('Skipping because missing categories');
      continue;
    }
    
    // Delete existing products & media for clean state
    await db.from('products').delete().eq('category_id', parentCat.id);
    await db.from('media').delete().eq('entity_id', childCat.id);
    
    // Scan directory
    let files = [];
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      files = entries.filter(e => e.isFile());
    } catch(e) {
      console.error('Cannot read dir:', dir, e.message);
      continue;
    }
    
    files.sort((a, b) => a.name.localeCompare(b.name, undefined, {numeric: true}));
    
    let firstImagePath = null;
    let index = 1;
    
    for (const file of files) {
      const ext = path.extname(file.name).toLowerCase();
      const isVideo = ext === '.mp4' || ext === '.mov' || ext === '.webm';
      const isImage = ext === '.jpg' || ext === '.jpeg' || ext === '.png' || ext === '.webp';
      
      if (!isVideo && !isImage) continue;
      
      const buffer = await fs.readFile(path.join(dir, file.name));
      const fileHash = hash(buffer);
      const safeName = fileHash.slice(0, 16) + ext;
      const storagePath = `materials/${parentSlug}/${childSlug}/${safeName}`;
      
      // Upload to bucket
      const { error: upErr } = await db.storage.from(BUCKET).upload(storagePath, buffer, {
        upsert: true,
        contentType: isVideo ? 'video/mp4' : (ext === '.png' ? 'image/png' : 'image/jpeg')
      });
      if (upErr) {
        console.error('Upload failed:', upErr.message);
        continue;
      }
      
      const mimeType = isVideo ? 'video/mp4' : (ext === '.png' ? 'image/png' : 'image/jpeg');
      const mediaType = isVideo ? 'video' : 'photo';
      
      // Keep track of first image for category cover
      if (isImage && !firstImagePath) firstImagePath = storagePath;
      
      // Insert Media for child collection
      const mediaRow = {
        file_name: file.name,
        storage_path: storagePath,
        bucket: BUCKET,
        mime_type: mimeType,
        file_size: buffer.length,
        alt_text: `${namePrefix} ${index}`,
        entity_type: 'category',
        entity_id: childCat.id,
        media_type: mediaType,
        sort_order: index,
        is_published: true,
        caption: `${namePrefix} ${index}`
      };
      await db.from('media').insert(mediaRow);
      
      // Insert Product for parent category
      const productRow = {
        name: `${namePrefix} ${index}`,
        title: `${namePrefix} ${index}`,
        slug: `${parentSlug}-${fileHash.slice(0, 8)}`,
        category_id: parentCat.id,
        category: parentCat.name,
        image_path: storagePath,
        price_label: 'PRICE AVAILABLE ON CONSULTATION',
        is_published: true,
        sort_order: index
      };
      await db.from('products').insert(productRow);
      
      index++;
    }
    
    // Update cover images
    if (firstImagePath) {
      await db.from('categories').update({ image_path: firstImagePath }).eq('id', parentCat.id);
      await db.from('categories').update({ image_path: firstImagePath }).eq('id', childCat.id);
      console.log(`Updated covers for ${parentSlug} and ${childSlug} to ${firstImagePath}`);
    }
    
    console.log(`Ingested ${index - 1} items for ${parentSlug}`);
  }
}
run().catch(console.error);
