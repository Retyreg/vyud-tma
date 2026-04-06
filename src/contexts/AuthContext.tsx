import { createContext, useContext, useEffect, useState } from 'react';
import type { FC, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { isTMA, getTelegramUser, getTelegramEmail, initTelegram } from '../lib/telegram';

export interface AuthUser {
  telegram_id?: number;
  email: string;
  username?: string;
  first_name?: string;
  credits: number;
  tariff: string;
  is_premium: boolean;
  auth_type: 'telegram' | 'email';
  total_generations: number;
  created_at?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  isTelegramMode: boolean;
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  isTelegramMode: false,
  refreshUser: async () => {},
  signOut: async () => {},
});

export const useAuthContext = () => useContext(AuthContext);

const WELCOME_CREDITS = 5;

async function fetchOrCreateUserByTelegramId(telegramId: number, email: string, username?: string, firstName?: string): Promise<AuthUser | null> {
  try {
    const { data, error } = await supabase
      .from('users_credits')
      .select('*')
      .eq('telegram_id', telegramId)
      .maybeSingle();

    if (error) throw error;

    if (data) {
      // Update last_seen, username if changed
      const updates: Record<string, unknown> = { last_seen: new Date().toISOString() };
      if (username && data.username !== username) updates.username = username;
      if (firstName && data.first_name !== firstName) updates.first_name = firstName;
      await supabase.from('users_credits').update(updates).eq('telegram_id', telegramId);

      return {
        telegram_id: telegramId,
        email: data.email || email,
        username: data.username || username,
        first_name: data.first_name || firstName,
        credits: data.credits ?? 0,
        tariff: data.tariff || 'free',
        is_premium: data.telegram_premium ?? false,
        auth_type: 'telegram',
        total_generations: data.total_generations ?? 0,
        created_at: data.created_at,
      };
    }

    // Create new user
    const newUser = {
      telegram_id: telegramId,
      email,
      username: username || null,
      first_name: firstName || null,
      credits: WELCOME_CREDITS,
      tariff: 'free',
      telegram_premium: false,
      total_generations: 0,
      created_at: new Date().toISOString(),
      last_seen: new Date().toISOString(),
    };
    const { data: inserted, error: insertErr } = await supabase
      .from('users_credits')
      .insert(newUser)
      .select()
      .single();

    if (insertErr) throw insertErr;

    return {
      telegram_id: telegramId,
      email,
      username,
      first_name: firstName,
      credits: inserted?.credits ?? WELCOME_CREDITS,
      tariff: 'free',
      is_premium: false,
      auth_type: 'telegram',
      total_generations: 0,
      created_at: inserted?.created_at,
    };
  } catch (e) {
    console.error('fetchOrCreateUserByTelegramId error:', e);
    return null;
  }
}

async function fetchUserByEmail(email: string): Promise<AuthUser | null> {
  try {
    const { data, error } = await supabase
      .from('users_credits')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error) throw error;

    // Запись есть — вернуть
    if (data) {
      return {
        email: data.email,
        username: data.username,
        first_name: data.first_name,
        credits: data.credits ?? 0,
        tariff: data.tariff || 'free',
        is_premium: data.telegram_premium ?? false,
        auth_type: 'email',
        total_generations: data.total_generations ?? 0,
        created_at: data.created_at,
      };
    }

    // Записи нет — создать автоматически
    const { data: inserted, error: insertErr } = await supabase
      .from('users_credits')
      .insert({
        email,
        credits: WELCOME_CREDITS,
        tariff: 'free',
        telegram_premium: false,
        total_generations: 0,
        created_at: new Date().toISOString(),
        last_seen: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertErr) {
      // RLS или другая ошибка insert — вернуть базовый профиль
      console.warn('Could not create users_credits record:', insertErr.message);
      return {
        email,
        credits: 0,
        tariff: 'free',
        is_premium: false,
        auth_type: 'email' as const,
        total_generations: 0,
      };
    }

    return {
      email,
      credits: inserted?.credits ?? WELCOME_CREDITS,
      tariff: 'free',
      is_premium: false,
      auth_type: 'email',
      total_generations: 0,
      created_at: inserted?.created_at,
    };
  } catch (e) {
    console.error('fetchUserByEmail error:', e);
    return null;
  }
}

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  // Evaluate at render time, not module load time
  const telegramMode = isTMA();

  const loadUser = async () => {
    setLoading(true);
    try {
      const timeout = new Promise<void>((_, reject) =>
        setTimeout(() => reject(new Error('auth timeout')), 4000)
      );
      await Promise.race([
        (async () => {
          if (telegramMode) {
            initTelegram();
            // Telegram WebApp may need a tick to expose user data after ready()
            await new Promise((r) => setTimeout(r, 100));
            const tgUser = getTelegramUser();
            if (tgUser) {
              const email = getTelegramEmail();
              const authUser = await fetchOrCreateUserByTelegramId(
                tgUser.id, email, tgUser.username, tgUser.first_name
              );
              setUser(authUser);
            }
          } else {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user?.email) {
              const authUser = await fetchUserByEmail(session.user.email);
              setUser(authUser);
            }
          }
        })(),
        timeout,
      ]);
    } catch (e) {
      console.warn('loadUser error or timeout:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();

    if (!telegramMode) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setUser(null);
        } else if (session?.user?.email) {
          const authUser = await fetchUserByEmail(session.user.email);
          setUser(authUser);
        }
      });
      return () => subscription.unsubscribe();
    }
  }, []);

  const refreshUser = async () => {
    if (!user) return;
    if (user.auth_type === 'telegram' && user.telegram_id) {
      const updated = await fetchOrCreateUserByTelegramId(user.telegram_id, user.email, user.username, user.first_name);
      if (updated) setUser(updated);
    } else {
      const updated = await fetchUserByEmail(user.email);
      if (updated) setUser(updated);
    }
  };

  const signOut = async () => {
    if (!telegramMode) {
      await supabase.auth.signOut();
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isTelegramMode: telegramMode, refreshUser, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
