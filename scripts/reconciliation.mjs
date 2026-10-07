import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const cats = ['laminate-flooring', 'spc-flooring', 'vinyl-flooring', 'pvc-wall-panels', 'wallpaper', 'folding-doors', 'false-ceiling', 'window-blinds', '3d-wall-picture', 'carpet-tile', 'artificial-grass'];

async function checkUrl(url) {
  if (!url) return 'NONE';
  try {
    const res = await fetch(url, { method: 'HEAD' });
    return res.status;
  } catch (e) {
    return 'FAIL';
  }
}

async function run() {
  const { data: categories } = await supabase.from('categories').select('*');
  const { data: media } = await supabase.from('media').select('*');
  const { data: products } = await supabase.from('products').select('*');

  let results = [];

  for (const catSlug of cats) {
    const parent = categories.find(x => x.slug === catSlug);
    if (!parent) {
      results.push({ CATEGORY: catSlug, CATEGORY_ID: 'MISSING', COLLECTION: 'N/A' });
      continue;
    }

    const collections = categories.filter(x => x.parent_id === parent.id);
    if (collections.length === 0) {
      results.push({ CATEGORY: parent.name, CATEGORY_ID: parent.id.slice(0,8), COLLECTION: 'NONE' });
    }

    for (const coll of collections) {
      const colMedia = media.filter(m => m.entity_id === coll.id);
      const pubMedia = colMedia.filter(m => m.is_published);
      const imgMedia = pubMedia.filter(m => !m.mime_type?.startsWith('video/'));
      const vidMedia = pubMedia.filter(m => m.mime_type?.startsWith('video/'));
      const primary = pubMedia.find(m => m.sort_order === 1 || m.page_number === 0);
      
      const colProds = products.filter(p => p.category_id === coll.id || p.category_id === parent.id);
      const pubProds = colProds.filter(p => p.is_published);

      let canonicalCover = 'NONE';
      let storageExists = false;
      let publicUrlStatus = 'NONE';

      let candidateUrl = '';
      let candidateSource = '';

      if (coll.image_path) {
        candidateSource = 'image_path';
        candidateUrl = process.env.NEXT_PUBLIC_SUPABASE_URL + '/storage/v1/object/public/site-assets/' + coll.image_path.replace(/^\/+/, '');
      } else if (primary) {
        candidateSource = 'primary_media';
        candidateUrl = process.env.NEXT_PUBLIC_SUPABASE_URL + '/storage/v1/object/public/' + primary.bucket + '/' + primary.storage_path;
      } else if (imgMedia.length > 0) {
        candidateSource = 'first_published_media';
        const first = imgMedia[0];
        candidateUrl = process.env.NEXT_PUBLIC_SUPABASE_URL + '/storage/v1/object/public/' + first.bucket + '/' + first.storage_path;
      }

      if (candidateUrl) {
        canonicalCover = candidateSource;
        const status = await checkUrl(candidateUrl);
        publicUrlStatus = status.toString();
        storageExists = (status === 200);
      }

      results.push({
        CATEGORY: parent.name,
        CATEGORY_ID: parent.id.slice(0,8),
        COLLECTION: coll.name,
        COLLECTION_ID: coll.id.slice(0,8),
        COLLECTION_SLUG: coll.slug,
        ACTIVE: coll.is_active,
        PUBLISHED: coll.is_active,
        IMAGE_PATH: coll.image_path ? 'YES' : 'NO',
        MEDIA_ROWS: colMedia.length,
        PUBLISHED_MEDIA: pubMedia.length,
        IMAGE_MEDIA: imgMedia.length,
        VIDEO_MEDIA: vidMedia.length,
        PRIMARY_MEDIA: primary ? 'YES' : 'NO',
        CANONICAL_COVER: canonicalCover,
        STORAGE_EXISTS: storageExists,
        PUBLIC_URL_STATUS: publicUrlStatus,
        PRODUCT_ROWS: colProds.length,
        PUBLISHED_PRODUCTS: pubProds.length
      });
    }
  }
  
  console.table(results);
}

run();
