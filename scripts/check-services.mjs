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
    const db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
    const { data, error } = await db.from("services").select("*").limit(1);
    console.log("Data:", data);
    console.log("Error:", error);
}
run().catch(console.error);
