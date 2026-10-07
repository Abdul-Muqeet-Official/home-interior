const { createClient } = require("@supabase/supabase-js");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const envLocal = fs.readFileSync(".env", "utf8");
const extract = (key) => {
  const match = envLocal.match(new RegExp(`${key}=(.*)`));
  return match ? match[1].trim() : null;
};
const supabase = createClient(extract("NEXT_PUBLIC_SUPABASE_URL"), extract("SUPABASE_SERVICE_ROLE_KEY"));

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
    let { data: childCat } = await supabase.from("categories").select("*").eq("slug", childSlug).single();
    if (!childCat) return console.log("childCat missing");

    const files = fs.readdirSync(target.folder);
    let order = 0;
    for (const file of files) {
      const fullPath = path.join(target.folder, file);
      const stat = fs.statSync(fullPath);
      if (!stat.isFile()) continue;
      
      const ext = path.extname(file).toLowerCase();
      if (!['.jpeg', '.jpg', '.mp4'].includes(ext)) continue;
      
      const buffer = fs.readFileSync(fullPath);
      const hash = crypto.createHash('sha256').update(buffer).digest('hex').substring(0, 16);
      
      const mediaType = ext === '.mp4' ? 'video' : 'image';
      const mimeType = mediaType === 'video' ? 'video/mp4' : 'image/jpeg';
      const storagePath = `${target.slug}/${childSlug}/${hash}${ext}`;
      
      // Upload
      const { error: upErr } = await supabase.storage.from("site-assets").upload(storagePath, buffer, { upsert: true, contentType: mimeType });
      
      // Insert media
      const { data: existingMedia } = await supabase.from("media").select("*").eq("entity_id", childCat.id).eq("storage_path", storagePath).maybeSingle();
      if (!existingMedia) {
        order += 10;
        const { error } = await supabase.from("media").insert({
          entity_type: "category",
          entity_id: childCat.id,
          bucket: "site-assets",
          storage_path: storagePath,
          file_name: file,
          file_size: stat.size,
          mime_type: mimeType,
          media_type: mediaType,
          sort_order: order,
          is_published: true
        });
        if (error) console.log("Insert error:", error);
      }
    }
    
    // Set cover for child and root
    const { data: childMedia } = await supabase.from("media").select("*").eq("entity_id", childCat.id).eq("media_type", "image").order("sort_order").limit(1).maybeSingle();
    if (childMedia) {
      await supabase.from("categories").update({ image_path: childMedia.storage_path }).eq("id", childCat.id);
      await supabase.from("categories").update({ image_path: childMedia.storage_path }).eq("id", rootCat.id);
      console.log(`Set cover for ${target.slug} to ${childMedia.storage_path}`);
    }
  }
}

run().catch(console.error);
