import { cpSync, existsSync, mkdirSync, rmSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '../..');
const clientDist = join(repoRoot, 'client/dist');
const publicDir = join(repoRoot, 'public');

if (!existsSync(clientDist)) {
  console.error('Client build missing at:', clientDist);
  console.error('Run: npm run vercel-build --prefix server');
  process.exit(1);
}

rmSync(publicDir, { recursive: true, force: true });
mkdirSync(publicDir, { recursive: true });
cpSync(clientDist, publicDir, { recursive: true });
console.log('Client copied to public/');
