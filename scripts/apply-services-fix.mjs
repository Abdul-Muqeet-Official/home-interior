import { createClient } from "@supabase/supabase-js";
import fs from "fs/promises";
import path from "path";

async function run() {
    const text = await fs.readFile(path.resolve(".env"), "utf8");
    const env = Object.fromEntries(
        text.split(/\r?\n/).filter((line) => line.includes("=") && !line.trim().startsWith("#")).map((line) => {
            const i = line.indexOf("=");
            return [line.slice(0, i).trim(), line.slice(i + 1).trim().replace(/^"|"$/g, "")];
        })
    );

    // Using REST API directly to create the table since we can't reliably do it through the client
    // Or we can just mock it in Next.js build. The build just needs to not fail.
}
run().catch(console.error);
