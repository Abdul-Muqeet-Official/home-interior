import fs from 'fs/promises';

async function replaceInFile(path) {
  let content = await fs.readFile(path, 'utf8');
  content = content.replace(/>Studio</g, '>HOME INTERIOR<');
  await fs.writeFile(path, content, 'utf8');
}

async function run() {
  await replaceInFile('app/materials/pvc-wall-panels/[series]/page.tsx');
  await replaceInFile('app/materials/[category]/page.tsx');
  await replaceInFile('components/ui/Header.tsx');
}
run();
