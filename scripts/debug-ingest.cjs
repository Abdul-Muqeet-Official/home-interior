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
];

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
}

async function run() {
  for (const target of TARGETS) {
    const childSlug = slugify(target.collectionName);
    let { data: childCat } = await supabase.from("categories").select("*").eq("slug", childSlug).single();
    if (!childCat) return console.log("childCat missing");
    
    const files = fs.readdirSync(target.folder);
    console.log(`Found ${files.length} files in folder`);
    let order = 0;
    for (const file of files) {
      const fullPath = path.join(target.folder, file);
      const stat = fs.statSync(fullPath);
      if (!stat.isFile()) continue;
      
      const ext = path.extname(file).toLowerCase();
      console.log(`Checking ${file} (ext: ${ext})`);
      if (!['.jpeg', '.jpg', '.mp4'].includes(ext)) {
         console.log("Skipped ext:", ext);
         continue;
      }
      
      const buffer = fs.readFileSync(fullPath);
      const hash = crypto.createHash('sha256').update(buffer).digest('hex').substring(0, 16);
      
      const mediaType = ext === '.mp4' ? 'video' : 'image';
      const storagePath = `${target.slug}/${childSlug}/${hash}${ext}`;
      
      console.log("Inserting media:", storagePath);
      const { data, error } = await supabase.from("media").insert({
        category_id: childCat.id,
        entity_type: "category",
        entity_id: childCat.id,
        bucket: "site-assets",
        storage_path: storagePath,
        media_type: mediaType,
        sort_order: order,
        is_published: true
      });
      if (error) console.log("Insert error:", error);
    }
  }
}
run();
