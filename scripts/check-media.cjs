const { createClient } = require("@supabase/supabase-js");
const fs = require("node:fs");
const path = require("node:path");

const envLocal = fs.readFileSync(".env", "utf8");
const extract = (key) => {
  const match = envLocal.match(new RegExp(`${key}=(.*)`));
  return match ? match[1].trim() : null;
};
const supabase = createClient(extract("NEXT_PUBLIC_SUPABASE_URL"), extract("SUPABASE_SERVICE_ROLE_KEY"));

async function run() {
  const { data, error } = await supabase.from("media").select("id, storage_path").ilike("storage_path", "%false-ceiling%");
  console.log("Media found:", data?.length);
  if (data?.length) {
    console.log(data.slice(0, 5));
  } else {
    console.log(error);
  }
}
run();
