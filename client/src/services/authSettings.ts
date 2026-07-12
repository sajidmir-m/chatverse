import { supabase } from './supabase';

interface AuthExternalProviders {
  google?: boolean;
  email?: boolean;
}

interface AuthSettingsResponse {
  external?: AuthExternalProviders;
}

export const getSupabaseProjectRef = (): string => {
  const url = import.meta.env.VITE_SUPABASE_URL || '';
  const match = url.match(/https:\/\/([^.]+)\.supabase\.co/);
  return match?.[1] || 'unknown';
};

export const isGoogleAuthEnabled = async (): Promise<boolean | null> => {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      return null;
    }

    const response = await fetch(`${supabaseUrl}/auth/v1/settings`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    const settings = (await response.json()) as AuthSettingsResponse;
    return settings.external?.google === true;
  } catch {
    return null;
  }
};

export const getCurrentSessionEmail = async (): Promise<string | null> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.user.email ?? null;
};
