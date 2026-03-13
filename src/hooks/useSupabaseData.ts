import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import WebApp from '@twa-dev/sdk';

export interface UserProfile {
  credits: number;
  current_streak: number;
  total_generations: number;
}

export interface Quiz {
  id: string;
  title: string;
  created_at: string;
  questions: any;
}

export const useSupabaseData = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const user = WebApp?.initDataUnsafe?.user;
        
        if (!user) {
          setError('User data not available (Not in Telegram?)');
          setLoading(false);
          return;
        }

        const telegram_id = user.id;
        const user_email = `${user.username || `user${user.id}`}@telegram.io`;

        // 1. Получаем профиль из users_credits
        const { data: profileData, error: profileError } = await supabase
          .from('users_credits')
          .select('credits, current_streak, total_generations')
          .eq('telegram_id', telegram_id)
          .single();

        if (profileError) throw profileError;
        setProfile(profileData);

        // 2. Получаем квизы пользователя
        const { data: quizzesData, error: quizzesError } = await supabase
          .from('quizzes')
          .select('id, title, created_at, questions')
          .eq('owner_email', user_email)
          .order('created_at', { ascending: false })
          .limit(10);

        if (quizzesError) throw quizzesError;
        setQuizzes(quizzesData || []);

      } catch (err: any) {
        console.error('Supabase fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { profile, quizzes, loading, error };
};
