import { execSync } from "node:child_process";
import sharp from "sharp";
import path from "node:path";

const videos = [
  {
    src: "C:\\Users\\DELL\\Pictures\\Folding Door\\Folding Door Video 2026-09-21 at 11.40.00 PM.mp4",
    name: "fd-video-18",
  },
  {
    src: "C:\\Users\\DELL\\Pictures\\Folding Door\\Folding Door Video 2026-09-21 at 11.42.57 PM.mp4",
    name: "fd-video-19",
  },
];

for (const v of videos) {
  try {
    const meta = JSON.parse(
      execSync(
        `ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of json "${v.src}"`
      ).toString()
    );
    const stream = meta.streams[0];
    console.log(`${v.name} dims: ${stream.width}x${stream.height}`);

    const outPath = path.resolve(
      "public/media/folding-doors",
      `${v.name}-poster.jpeg`
    );
    execSync(
      `ffmpeg -y -i "${v.src}" -ss 1 -frames:v 1 -q:v 2 "${outPath}"`
    );
    console.log(`  poster: ${outPath}`);

    sharp(outPath)
      .metadata()
      .then((m) =>
        console.log(`  poster dims: ${m.width}x${m.height}`)
      )
      .catch(() => {});
  } catch (e) {
    console.error(`${v.name} error:`, e.message);
  }
}
