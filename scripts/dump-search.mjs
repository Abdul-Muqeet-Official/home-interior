import { getSearchIndex, getCategories } from "./lib/supabase/queries.js";

async function run() {
    const cats = await getCategories();
    console.log("Categories:", cats.map(c => c.slug).filter(s => s.includes("carpet")));
    
    const idx = await getSearchIndex();
    console.log("Search Index (Carpet):", idx.filter(i => i.title.toLowerCase().includes("carpet")));
}

// Next.js uses tsconfig paths, so we need to compile it or use ts-node
