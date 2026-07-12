import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const clientDir = join(__dirname, '../../client');
const envFile = join(clientDir, '.env.production.local');

const supabaseUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').trim();
const supabaseAnonKey = (
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  ''
).trim();

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('');
  console.error('Missing Supabase env vars for frontend build.');
  console.error('Set in Vercel Environment Variables (Production + Preview):');
  console.error('  VITE_SUPABASE_URL  (or SUPABASE_URL)');
  console.error('  VITE_SUPABASE_ANON_KEY  (or SUPABASE_ANON_KEY)');
  console.error('');
  process.exit(1);
}

const apiUrl = (process.env.VITE_API_URL || '').trim();
const socketUrl = (process.env.VITE_SOCKET_URL || '').trim();

const lines = [
  `VITE_SUPABASE_URL=${supabaseUrl}`,
  `VITE_SUPABASE_ANON_KEY=${supabaseAnonKey}`,
];

if (apiUrl) lines.push(`VITE_API_URL=${apiUrl}`);
if (socketUrl) lines.push(`VITE_SOCKET_URL=${socketUrl}`);

writeFileSync(envFile, `${lines.join('\n')}\n`, 'utf8');
console.log('Client env prepared for production build');
