import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase config");
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

const TARGETS = [
  { slug: "false-ceiling", folder: "C:\\Users\\DELL\\Pictures\\False ceiling", collectionName: "False Ceiling Projects" },
  { slug: "window-blinds", folder: "C:\\Users\\DELL\\Pictures\\Roller blinds", collectionName: "Roller Blinds Series" },
  { slug: "artificial-grass", folder: "C:\\Users\\DELL\\Pictures\\Artificial grass", collectionName: "Artificial Grass Installations" },
  { slug: "folding-doors", folder: "C:\\Users\\DELL\\Pictures\\Folding Door", collectionName: "Folding Doors Systems" },
];

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
}

async function run() {
  for (const target of TARGETS) {
    console.log(`\nProcessing ${target.slug}...`);
    const { data: rootCat } = await supabase.from("categories").select("*").eq("slug", target.slug).single();
    if (!rootCat) {
      console.log(`Root category ${target.slug} not found, skipping.`);
      continue;
    }
    
    const childSlug = slugify(target.collectionName);
    let { data: childCat } = await supabase.from("categories").select("*").eq("slug", childSlug).maybeSingle();
    
    if (!childCat) {
      console.log(`Creating child collection: ${target.collectionName}`);
      const { data, error } = await supabase.from("categories").insert({
        name: target.collectionName,
        slug: childSlug,
        parent_id: rootCat.id,
        is_active: true,
        sort_order: 10
      }).select().single();
      if (error) throw error;
      childCat = data;
    } else {
      console.log(`Found child collection: ${target.collectionName}`);
    }

    const files = await fs.readdir(target.folder);
    let order = 0;
    for (const file of files) {
      const fullPath = path.join(target.folder, file);
      const stat = await fs.stat(fullPath);
      if (!stat.isFile()) continue;
      
      const ext = path.extname(file).toLowerCase();
      if (!['.jpeg', '.jpg', '.mp4'].includes(ext)) continue;
      
      const buffer = await fs.readFile(fullPath);
      const hash = crypto.createHash('sha256').update(buffer).digest('hex').substring(0, 16);
      
      const mediaType = ext === '.mp4' ? 'video' : 'image';
      const storagePath = `${target.slug}/${childSlug}/${hash}${ext}`;
      
      // Upload
      const { error: upErr } = await supabase.storage.from("site-assets").upload(storagePath, buffer, { upsert: true, contentType: mediaType === 'video' ? 'video/mp4' : 'image/jpeg' });
      if (upErr) console.log(`Upload error for ${file}: ${upErr.message}`);
      
      // Insert media
      const { data: existingMedia } = await supabase.from("media").select("*").eq("category_id", childCat.id).eq("storage_path", storagePath).maybeSingle();
      if (!existingMedia) {
        order += 10;
        await supabase.from("media").insert({
          category_id: childCat.id,
          entity_type: "category",
          entity_id: childCat.id,
          bucket: "site-assets",
          storage_path: storagePath,
          media_type: mediaType,
          sort_order: order,
          is_published: true
        });
      }
    }
    
    // Set cover for child and root
    const { data: childMedia } = await supabase.from("media").select("*").eq("category_id", childCat.id).eq("media_type", "image").order("sort_order").limit(1).single();
    if (childMedia) {
      await supabase.from("categories").update({ image_path: childMedia.storage_path }).eq("id", childCat.id);
      await supabase.from("categories").update({ image_path: childMedia.storage_path }).eq("id", rootCat.id);
    }
  }
}

run().catch(console.error);
