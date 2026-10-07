/**
 * scripts/_seed_collections.mjs
 *
 * Seeds the catalogue hierarchy in Supabase and imports the local reference
 * media from public/media/ into the project's storage buckets, linking each
 * file to its category via the public.media table.
 *
 * Idempotent: categories are upserted by slug, media files are skipped when
 * they already exist in storage, and media rows are upserted by storage_path.
 *
 * Usage:
 *   node scripts/_seed_collections.mjs
 *
 * Requires:
 *   - SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC_MEDIA = path.join(ROOT, "public", "media");
const BUCKET = "site-assets";

const env = Object.fromEntries(
  fs
    .readFileSync(path.join(ROOT, ".env"), "utf8")
    .split(/\r?\n/)
    .filter((line) => line.includes("=") && !line.trim().startsWith("#"))
    .map((line) => {
      const i = line.indexOf("=");
      return [line.slice(0, i).trim(), line.slice(i + 1).trim().replace(/^"|"$/g, "")];
    })
);

const url = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("SKIP: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY not found in .env");
  process.exit(0);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const log = (label, ...args) => console.log(`[${label}]`, ...args);

const MIME_BY_EXT = {
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

function mimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_BY_EXT[ext] || "application/octet-stream";
}

function isVideo(filePath) {
  return mimeType(filePath).startsWith("video/");
}

/**
 * Each category: slug, name, editorial copy, stats, cover image path,
 * and the local media directory + editorial order (filename list).
 */
const CATEGORY_SEED = [
  {
    slug: "folding-doors",
    name: "Folding Doors",
    description:
      "Space-efficient folding systems that open interiors to light, air and garden views.",
    sort_order: 6,
    is_active: true,
    parent_id: null,
    eyebrow: "FOLDING DOORS Â· COLLECTION",
    heading: "Folding Doors",
    lede:
      "Seventeen photographs and two walkthrough films of aluminium and timber folding door systems installed across Karachi residences. This is editorial reference photography of completed work; door rates are confirmed on consultation.",
    edit_heading: "The edit",
    edit_note:
      "Published as a single edit from a nineteen-frame source archive (two MP4 walkthrough films plus seventeen still photographs). Two exact-MD5 duplicate frames were set aside so every view in the collection earns its place.",
    rail_aria: "Folding doors collection â€” stills and walkthrough film",
    category_action: "View the Folding Doors",
    cover_image_alt: "A pair of full-height folding glass doors opened wide against a pale stone floor, daylight spilling through the glazing into a living space.",
    stats_json: { photographs: 17, films: 2, source_frames: 19 },
    /** Sorted in editorial order (lead first). */
    mediaDir: "folding-doors",
    coverMedia: "fd-17.jpeg",
    editorialOrder: [
      "fd-17.jpeg",
      "fd-video-18.mp4",
      "fd-01.jpeg",
      "fd-02.jpeg",
      "fd-03.jpeg",
      "fd-04.jpeg",
      "fd-05.jpeg",
      "fd-video-19.mp4",
      "fd-06.jpeg",
      "fd-07.jpeg",
      "fd-08.jpeg",
      "fd-09.jpeg",
      "fd-10.jpeg",
      "fd-11.jpeg",
      "fd-12.jpeg",
      "fd-13.jpeg",
      "fd-14.jpeg",
      "fd-15.jpeg",
      "fd-16.jpeg",
    ],
  },
  {
    slug: "pvc-wall-panels",
    name: "PVC Wall Panels",
    description:
      "PVC wall panels across six series â€” Aura, Enigma, Prestige, Regular Vol 1, Royal and Slatted. Each series is photographed as built across residential Karachi projects.",
    sort_order: 4,
    is_active: true,
    parent_id: null,
    eyebrow: "PVC WALL PANELS Â· COLLECTION",
    heading: "PVC Wall Panels",
    lede:
      "PVC wall panels across six series â€” Aura, Enigma, Prestige, Regular Vol 1, Royal and Slatted. Each series is photographed as built across residential Karachi projects. This is editorial reference photography; panel rates are confirmed on consultation.",
    edit_heading: "The edit",
    edit_note:
      "Each series is published as a single edit from its source archive. Every frame captures a distinct installation view; duplicates were set aside where present.",
    rail_aria: "PVC Wall Panels collection â€” stills across series",
    category_action: "View the PVC Wall Panels collection",
    cover_image_alt: "PVC Wall Panels â€” studio collection study",
    stats_json: { photographs: 57, films: 0, source_frames: 57 },
    mediaDir: null,
    coverMedia: null,
    editorialOrder: [],
  },
];

const SERIES_SEED = [
  {
    slug: "aura-series",
    name: "Aura Series",
    parent: "pvc-wall-panels",
    description:
      "Matte-finish PVC wall panels with seamless tongue-and-groove joints and full-height vertical runs.",
    sort_order: 1,
    is_active: true,
    eyebrow: "PVC WALL PANELS Â· AURA SERIES",
    heading: "Aura Series",
    lede:
      "Eleven photographs of the Aura Series PVC wall panels installed across Karachi residences â€” matte finishes, seamless joints and full-height runs. This is editorial reference photography of completed work; panel rates are confirmed on consultation.",
    edit_heading: "The edit",
    edit_note:
      "Published as a single edit from an eleven-frame source archive. Every frame is a distinct installation view; no duplicates were set aside.",
    rail_aria: "Aura Series stills",
    category_action: "View the Aura Series",
    cover_image_alt: "A seamless PVC wall panel installation in a soft grey matte, the vertical joints invisible beneath a single plane of light.",
    stats_json: { photographs: 11, films: 0, source_frames: 11 },
    mediaDir: "pvc-wall-panels/aura-series",
    coverMedia: "pvc-01.jpeg",
    editorialOrder: [
      "pvc-01.jpeg", "pvc-02.jpeg", "pvc-03.jpeg", "pvc-04.jpeg", "pvc-05.jpeg",
      "pvc-06.jpeg", "pvc-07.jpeg", "pvc-08.jpeg", "pvc-09.jpeg", "pvc-10.jpeg",
      "pvc-11.jpeg",
    ],
  },
  {
    slug: "enigma-series",
    name: "Enigma Series",
    parent: "pvc-wall-panels",
    description:
      "Deep-tone PVC wall panels with a matte surface finish and narrow reveal profile, installed full-height in residential interiors.",
    sort_order: 2,
    is_active: true,
    eyebrow: "PVC WALL PANELS Â· ENIGMA SERIES",
    heading: "Enigma Series",
    lede:
      "Ten photographs of Enigma Series PVC wall panels installed across residential Karachi projects â€” deep-tone finishes, full-height runs and narrow reveals. This is editorial reference photography of completed work; panel rates are confirmed on consultation.",
    edit_heading: "The edit",
    edit_note:
      "Published as a single edit from a ten-frame source archive. Every frame captures a distinct installation view; no duplicates were set aside.",
    rail_aria: "Enigma Series stills",
    category_action: "View the Enigma Series",
    cover_image_alt: "A dark-toned Enigma Series PVC wall panel installation, the subtle woodgrain print set against a deep charcoal surface under warm interior lighting.",
    stats_json: { photographs: 10, films: 0, source_frames: 10 },
    mediaDir: "pvc-wall-panels/enigma-series",
    coverMedia: "pvc-01.jpeg",
    editorialOrder: [
      "pvc-01.jpeg", "pvc-02.jpeg", "pvc-03.jpeg", "pvc-04.jpeg", "pvc-05.jpeg",
      "pvc-06.jpeg", "pvc-07.jpeg", "pvc-08.jpeg", "pvc-09.jpeg", "pvc-10.jpeg",
    ],
  },
  {
    slug: "prestige",
    name: "Prestige",
    parent: "pvc-wall-panels",
    description:
      "Large-format PVC wall panels with a minimal edge profile and shadow-groove joint system.",
    sort_order: 3,
    is_active: true,
    eyebrow: "PVC WALL PANELS Â· PRESTIGE",
    heading: "Prestige",
    lede:
      "Thirteen photographs of Prestige Series PVC wall panels installed across residential kitchens, hallways and bathrooms â€” large-format prints, minimal edge profiles and shadow-groove joints. This is editorial reference photography of completed work; panel rates are confirmed on consultation.",
    edit_heading: "The edit",
    edit_note:
      "Published as a single edit from a thirteen-frame source archive. Every frame captures a distinct installation view; no duplicates were set aside.",
    rail_aria: "Prestige stills",
    category_action: "View the Prestige collection",
    cover_image_alt: "A Prestige Series PVC wall installation in a living room, the large-format panels creating a smooth contemporary feature wall.",
    stats_json: { photographs: 13, films: 0, source_frames: 13 },
    mediaDir: "pvc-wall-panels/prestige",
    coverMedia: "pvc-01.jpeg",
    editorialOrder: [
      "pvc-01.jpeg", "pvc-02.jpeg", "pvc-03.jpeg", "pvc-04.jpeg", "pvc-05.jpeg",
      "pvc-06.jpeg", "pvc-07.jpeg", "pvc-08.jpeg", "pvc-09.jpeg", "pvc-10.jpeg",
      "pvc-11.jpeg", "pvc-12.jpeg", "pvc-13.jpeg",
    ],
  },
  {
    slug: "regular-vol-1",
    name: "Regular Vol 1",
    parent: "pvc-wall-panels",
    description:
      "Woodgrain-print PVC wall panels on a rigid core, installed full-height in residential interiors.",
    sort_order: 4,
    is_active: true,
    eyebrow: "PVC WALL PANELS Â· REGULAR VOL 1",
    heading: "Regular Vol 1",
    lede:
      "Four full-height photographs of Regular Vol 1 PVC wall panels â€” a woodgrain print on a robust core, installed from floor to ceiling in residential kitchens and living spaces. This is editorial reference photography of completed work; panel rates are confirmed on consultation.",
    edit_heading: "The edit",
    edit_note:
      "Published as a single edit from a four-frame source archive. Each frame captures a distinct wall face; no duplicates were set aside.",
    rail_aria: "Regular Vol 1 stills",
    category_action: "View the Regular Vol 1",
    cover_image_alt: "A tall portrait shot of a Regular Vol 1 PVC panel installed from floor to ceiling, the vertical grain running the full height of the wall.",
    stats_json: { photographs: 4, films: 0, source_frames: 4 },
    mediaDir: "pvc-wall-panels/regular-vol-1",
    coverMedia: "pvc-01.jpeg",
    editorialOrder: ["pvc-01.jpeg", "pvc-02.jpeg", "pvc-03.jpeg", "pvc-04.jpeg"],
  },
  {
    slug: "royal-series",
    name: "Royal Series",
    parent: "pvc-wall-panels",
    description:
      "Matte-finish PVC wall panels in full-height vertical boards with a narrow reveal profile.",
    sort_order: 5,
    is_active: true,
    eyebrow: "PVC WALL PANELS Â· ROYAL SERIES",
    heading: "Royal Series",
    lede:
      "Five photographs of Royal Series PVC wall panels installed across residential Karachi projects â€” full-height vertical planks with a matte face and narrow reveal. This is editorial reference photography of completed work; panel rates are confirmed on consultation.",
    edit_heading: "The edit",
    edit_note:
      "Published as a single edit from a five-frame source archive. Every frame captures a distinct installation view; no duplicates were set aside.",
    rail_aria: "Royal Series stills",
    category_action: "View the Royal Series",
    cover_image_alt: "A Royal Series PVC wall panel installation, full-height vertical planks with a smooth matte face and narrow reveal between boards.",
    stats_json: { photographs: 5, films: 0, source_frames: 5 },
    mediaDir: "pvc-wall-panels/royal-series",
    coverMedia: "pvc-01.jpeg",
    editorialOrder: ["pvc-01.jpeg", "pvc-02.jpeg", "pvc-03.jpeg", "pvc-04.jpeg", "pvc-05.jpeg"],
  },
  {
    slug: "slatted-series",
    name: "Slatted Series",
    parent: "pvc-wall-panels",
    description:
      "Narrow parallel PVC wall panels with shadow-line spacing, installed vertically in residential interiors.",
    sort_order: 6,
    is_active: true,
    eyebrow: "PVC WALL PANELS Â· SLATTED SERIES",
    heading: "Slatted Series",
    lede:
      "Fourteen photographs of Slatted Series PVC wall panels installed across residential Karachi projects â€” narrow parallel boards with shadow-line spacing, vertical runs and feature walls. This is editorial reference photography of completed work; panel rates are confirmed on consultation.",
    edit_heading: "The edit",
    edit_note:
      "Published as a single edit from a fourteen-frame source archive. Every frame captures a distinct installation view; no duplicates were set aside.",
    rail_aria: "Slatted Series stills",
    category_action: "View the Slatted Series",
    cover_image_alt: "A Slatted Series PVC wall installation with narrow parallel boards set at regular spacing, shadow lines creating depth.",
    stats_json: { photographs: 14, films: 0, source_frames: 14 },
    mediaDir: "pvc-wall-panels/slatted-series",
    coverMedia: "pvc-01.jpeg",
    editorialOrder: [
      "pvc-01.jpeg", "pvc-02.jpeg", "pvc-03.jpeg", "pvc-04.jpeg", "pvc-05.jpeg",
      "pvc-06.jpeg", "pvc-07.jpeg", "pvc-08.jpeg", "pvc-09.jpeg", "pvc-10.jpeg",
      "pvc-11.jpeg", "pvc-12.jpeg", "pvc-13.jpeg", "pvc-14.jpeg",
    ],
  },
];

/**
 * Collect media file paths from a directory. Returns an ordered list of
 * relative file paths (relative to PUBLIC_MEDIA), sorted to match the
 * editorial order when possible, then alphabetically for any extras.
 */
function collectMediaFiles(mediaDir, editorialOrder) {
  const dir = path.join(PUBLIC_MEDIA, mediaDir);
  if (!fs.existsSync(dir)) return [];

  const allFiles = fs
    .readdirSync(dir)
    .filter((f) => !f.startsWith("."))
    .map((f) => path.join(mediaDir, f));

  // Split out poster files (they're handled separately as poster_path)
  const mainFiles = allFiles.filter((f) => !/-(poster)\./i.test(path.basename(f)));

  // Order by editorial list, then append any extras alphabetically
  const ordered = editorialOrder
    .map((name) => mainFiles.find((f) => path.basename(f) === name))
    .filter(Boolean);
  const extras = mainFiles
    .filter((f) => !editorialOrder.includes(path.basename(f)))
    .sort();

  return [...ordered, ...extras];
}

/** Upload a local file to the storage bucket, skipping if it already exists. */
async function uploadFile(localPath, storagePath) {
  const exists = await supabase.storage.from(BUCKET).list(path.dirname(storagePath), {
    limit: 1000,
  }).then((res) => {
    if (res.error) return false;
    return res.data?.some((f) => f.name === path.basename(storagePath));
  });

  if (exists) {
    return { path: storagePath, skipped: true };
  }

  const buffer = fs.readFileSync(localPath);
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, {
      contentType: mimeType(localPath),
      upsert: false,
    });

  if (error) throw error;
  return { path: data?.path, skipped: false };
}

async function upsertCategory(cat) {
  const slug = cat.slug;
  const { data, error } = await supabase
    .from("categories")
    .upsert({
      name: cat.name,
      slug,
      description: cat.description,
      image_path: cat.coverMedia ? `${cat.mediaDir}/${cat.coverMedia}` : null,
      sort_order: cat.sort_order,
      is_active: cat.is_active,
      parent_id: cat.parent_id,
      eyebrow: cat.eyebrow ?? null,
      heading: cat.heading ?? null,
      lede: cat.lede ?? null,
      edit_heading: cat.edit_heading ?? null,
      edit_note: cat.edit_note ?? null,
      rail_aria: cat.rail_aria ?? null,
      category_action: cat.category_action ?? null,
      cover_image_alt: cat.cover_image_alt ?? null,
      stats_json: cat.stats_json ?? {},
      updated_at: new Date().toISOString(),
    }, { on: "slug" })
    .select("id")
    .single();

  if (error) throw error;
  log("upserted category", slug, data.id);
  return data.id;
}

async function upsertMedia(categoryId, localRelPath, sortOrder, altText, caption) {
  const localPath = path.join(PUBLIC_MEDIA, localRelPath);
  if (!fs.existsSync(localPath)) {
    log("skip missing", localRelPath);
    return;
  }

  const storagePath = `collections/${localRelPath.replace(/\\/g, "/")}`;
  const uploaded = await uploadFile(localPath, storagePath);
  if (uploaded.skipped) {
    log("already uploaded", localRelPath);
  }

  const video = isVideo(localRelPath);
  let posterStoragePath = null;
  if (video) {
    // Look for matching poster file
    const baseName = path.basename(localRelPath, path.extname(localRelPath));
    const posterCandidates = [
      `${baseName}-poster.jpeg`,
      `${baseName}-poster.jpg`,
      `${baseName}-poster.png`,
    ];
    for (const candidate of posterCandidates) {
      const posterLocal = path.join(path.dirname(localPath), candidate);
      if (fs.existsSync(posterLocal)) {
        posterStoragePath = `collections/${path.join(path.dirname(localRelPath), candidate).replace(/\\/g, "/")}`;
        await uploadFile(posterLocal, posterStoragePath);
        break;
      }
    }
  }

  const mediaType = video ? "video" : "image";
  const { data, error } = await supabase
    .from("media")
    .upsert({
      file_name: path.basename(localRelPath),
      storage_path: storagePath,
      bucket: BUCKET,
      mime_type: mimeType(localRelPath),
      file_size: fs.statSync(localPath).size,
      alt_text: altText ?? null,
      caption: caption ?? null,
      entity_type: "category",
      entity_id: categoryId,
      is_featured: sortOrder === 0,
      sort_order: sortOrder,
      poster_path: posterStoragePath,
      width: null,
      height: null,
      updated_at: new Date().toISOString(),
    }, { on: "storage_path" })
    .select("id")
    .single();

  if (error) throw error;
  log(`upserted ${mediaType}`, localRelPath, "â†’", storagePath);
  return data.id;
}

const altCaptions = {
  // Folding Doors (lead + key images)
  "folding-doors/fd-17.jpeg": {
    alt: "A pair of full-height folding glass doors opened wide against a pale stone floor, daylight spilling through the glazing into a living space.",
    caption: "Folding glass doors opened to the terrace.",
  },
  "folding-doors/fd-video-18.mp4": {
    alt: "Vertical walkthrough film showing a set of folding doors being opened and closed in a living space, natural light from the windows.",
    caption: "Walkthrough film â€” 0:26, vertical.",
  },
  "folding-doors/fd-video-19.mp4": {
    alt: "Vertical walkthrough film of a timber-framed folding door opening across a wide aperture, daylight and shadow.",
    caption: "Walkthrough film â€” 0:23, vertical.",
  },
  // PVC series lead images
  "pvc-wall-panels/enigma-series/pvc-01.jpeg": {
    alt: "A dark-toned Enigma Series PVC wall panel installation, the subtle woodgrain print set against a deep charcoal surface under warm interior lighting.",
    caption: "Deep-tone Enigma Series wall.",
  },
  "pvc-wall-panels/royal-series/pvc-01.jpeg": {
    alt: "A Royal Series PVC wall panel installation, full-height vertical planks with a smooth matte face and narrow reveal between boards.",
    caption: "Full-height Royal Series wall.",
  },
  "pvc-wall-panels/slatted-series/pvc-01.jpeg": {
    alt: "A Slatted Series PVC wall installation with narrow parallel boards set at regular spacing, shadow lines creating depth.",
    caption: "Slatted profile wall.",
  },
};

async function seedMediaForCategory(categoryId, category) {
  if (!category.mediaDir || !category.editorialOrder) return;

  const files = collectMediaFiles(category.mediaDir, category.editorialOrder);
  for (let i = 0; i < files.length; i++) {
    const localRelPath = files[i];
    const meta = altCaptions[localRelPath];
    await upsertMedia(
      categoryId,
      localRelPath,
      i,
      meta?.alt ?? null,
      meta?.caption ?? null
    );
  }
}

async function main() {
  log("Starting catalogue hierarchy seed");

  // 1) Upsert parent categories (no parent_id)
  const parentIds = new Map();
  for (const cat of CATEGORY_SEED) {
    const id = await upsertCategory(cat);
    parentIds.set(cat.slug, id);
  }

  // 2) Upsert child categories (series) with parent_id pointing to PVC Wall Panels
  const pvcWallPanelsId = parentIds.get("pvc-wall-panels");
  if (!pvcWallPanelsId) {
    log("ERROR: PVC Wall Panels parent category not found");
    process.exit(1);
  }

  for (const series of SERIES_SEED) {
    const id = await upsertCategory({
      ...series,
      parent_id: pvcWallPanelsId,
    });
    parentIds.set(series.slug, id);
  }

  // 3) Import media for each category
  for (const cat of CATEGORY_SEED) {
    const id = parentIds.get(cat.slug);
    await seedMediaForCategory(id, cat);
  }

  for (const series of SERIES_SEED) {
    const id = parentIds.get(series.slug);
    await seedMediaForCategory(id, series);
  }

  log("Seed complete");

  // 4) Summary
  const { count: catCount } = await supabase
    .from("categories")
    .select("*", { count: "exact", head: true });

  const { count: mediaCount } = await supabase
    .from("media")
    .select("*", { count: "exact", head: true })
    .eq("entity_type", "category");

  log("Summary");
  console.log(`  Categories: ${catCount}`);
  console.log(`  Category media records: ${mediaCount}`);
  console.log(`  Bucket: ${BUCKET}`);
}

main().catch((err) => {
  console.error("FATAL:", err.message ?? err);
  process.exit(1);
});

