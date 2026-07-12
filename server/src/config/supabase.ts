import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

let supabaseInstance: SupabaseClient | null = null;

const getEnv = (): { url: string; serviceKey: string; anonKey: string } => {
  const url = process.env.SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const anonKey = process.env.SUPABASE_ANON_KEY?.trim();

  if (!url || !serviceKey || !anonKey) {
    throw new Error(
      'Missing Supabase env vars. Set SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY in Vercel.'
    );
  }

  return { url, serviceKey, anonKey };
};

export const getSupabase = (): SupabaseClient => {
  if (!supabaseInstance) {
    const { url, serviceKey } = getEnv();
    supabaseInstance = createClient(url, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return supabaseInstance;
};

export const getSupabaseConfig = (): { url: string; anonKey: string } => {
  const { url, anonKey } = getEnv();
  return { url, anonKey };
};

/** @deprecated Use getSupabase() — kept for minimal service file churn */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getSupabase() as object, prop, receiver);
  },
});

export const supabaseConfig = new Proxy({} as { url: string; anonKey: string }, {
  get(_target, prop) {
    const config = getSupabaseConfig();
    return config[prop as keyof typeof config];
  },
});
