import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import { apiService, CreateProfileData, UpdateProfileData } from '../services/api';
import { supabase } from '../services/supabase';
import { getOAuthRedirectUrl } from '../constants/auth';
import { AuthState, UserProfile } from '../types';

interface AuthContextValue extends AuthState {
  isLoading: boolean;
  accessToken: string | null;
  authUserId: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  setupProfile: (data: CreateProfileData) => Promise<void>;
  updateProfile: (data: UpdateProfileData) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [email, setEmail] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const applySession = useCallback(
    (sessionEmail: string | null, userProfile: UserProfile | null, userId: string | null) => {
      setEmail(sessionEmail);
      setProfile(userProfile);
      setUsername(userProfile?.username ?? null);
      setHasProfile(Boolean(userProfile?.username));
      setAuthUserId(userId);
    },
    []
  );

  const refreshProfile = useCallback(async (): Promise<void> => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      applySession(null, null, null);
      setAccessToken(null);
      return;
    }

    setAccessToken(session.access_token);

    try {
      const me = await apiService.getMe();
      applySession(me.email, me.profile, session.user.id);
    } catch {
      applySession(session.user.email ?? null, null, session.user.id);
    }
  }, [applySession]);

  useEffect(() => {
    const init = async (): Promise<void> => {
      try {
        await refreshProfile();
      } finally {
        setIsLoading(false);
      }
    };
    init();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async () => {
      await refreshProfile();
    });
    return () => subscription.unsubscribe();
  }, [refreshProfile]);

  const login = useCallback(
    async (userEmail: string, password: string): Promise<void> => {
      const { error } = await supabase.auth.signInWithPassword({
        email: userEmail.trim(),
        password,
      });
      if (error) throw new Error(error.message);
      await refreshProfile();
    },
    [refreshProfile]
  );

  const register = useCallback(
    async (userEmail: string, password: string): Promise<void> => {
      const { data, error } = await supabase.auth.signUp({
        email: userEmail.trim(),
        password,
      });
      if (error) throw new Error(error.message);
      if (!data.session) {
        throw new Error('Check your email to confirm your account, then log in.');
      }
      await refreshProfile();
    },
    [refreshProfile]
  );

  const loginWithGoogle = useCallback(async (): Promise<void> => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: getOAuthRedirectUrl(),
        queryParams: { access_type: 'offline', prompt: 'select_account' },
      },
    });
    if (error) throw new Error(error.message);
  }, []);

  const setupProfile = useCallback(
    async (data: CreateProfileData): Promise<void> => {
      const available = await apiService.checkUsernameAvailable(data.username.trim());
      if (!available) throw new Error('Username is already taken');
      await apiService.createProfile(data);
      await refreshProfile();
    },
    [refreshProfile]
  );

  const updateProfile = useCallback(
    async (data: UpdateProfileData): Promise<void> => {
      const updated = await apiService.updateProfile(data);
      setProfile(updated);
      setUsername(updated.username);
    },
    []
  );

  const logout = useCallback(async (): Promise<void> => {
    await supabase.auth.signOut();
    applySession(null, null, null);
    setAccessToken(null);
  }, [applySession]);

  const value = useMemo(
    () => ({
      email,
      username,
      profile,
      hasProfile,
      isLoading,
      accessToken,
      authUserId,
      login,
      register,
      loginWithGoogle,
      setupProfile,
      updateProfile,
      logout,
      refreshProfile,
    }),
    [
      email,
      username,
      profile,
      hasProfile,
      isLoading,
      accessToken,
      authUserId,
      login,
      register,
      loginWithGoogle,
      setupProfile,
      updateProfile,
      logout,
      refreshProfile,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
