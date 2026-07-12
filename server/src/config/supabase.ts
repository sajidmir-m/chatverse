import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Missing required environment variable: SUPABASE_URL');
}

if (!supabaseServiceRoleKey) {
  throw new Error('Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY');
}

if (!supabaseAnonKey) {
  throw new Error('Missing required environment variable: SUPABASE_ANON_KEY');
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export const supabaseConfig = {
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
};
