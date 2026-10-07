import fs from 'fs/promises';

async function run() {
  let content = await fs.readFile('lib/supabase/queries.ts', 'utf8');

  // Next.js caching optimization
  if (!content.includes('import { cache } from \'react\'')) {
    content = 'import { cache } from \'react\';\n' + content;
  }
  
  const functions = [
    'getCategories',
    'getProducts',
    'getProjects',
    'getServices',
    'getReviews'
  ];
  
  for (const fn of functions) {
    if (content.includes(`export const ${fn} = cache(`)) continue;
    
    // Find 'export async function getCategories(): Promise<Category[]> {'
    const regex = new RegExp(`export async function ${fn}\\(\\): Promise<([a-zA-Z\\[\\]]+)> \\{`);
    const match = content.match(regex);
    if (!match) {
      console.log('Could not find', fn);
      continue;
    }
    
    const startIdx = match.index;
    const blockStart = startIdx + match[0].length;
    
    // find matching closing brace
    let braceCount = 1;
    let endIdx = -1;
    for (let i = blockStart; i < content.length; i++) {
      if (content[i] === '{') braceCount++;
      if (content[i] === '}') braceCount--;
      if (braceCount === 0) {
        endIdx = i;
        break;
      }
    }
    
    if (endIdx === -1) {
      console.log('Could not find end of', fn);
      continue;
    }
    
    const before = content.slice(0, startIdx);
    const signature = `export const ${fn} = cache(async function ${fn}(): Promise<${match[1]}> {`;
    const body = content.slice(blockStart, endIdx);
    const after = content.slice(endIdx + 1);
    
    content = before + signature + body + '});' + after;
  }

  // Write it back
  await fs.writeFile('lib/supabase/queries.ts', content);
}
run();
