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

const API_URL = import.meta.env.VITE_API_URL || 'https://api.vyud.online/api';
const API_KEY = import.meta.env.VITE_API_KEY || '';
const MOCK_USER_ID = 5701645456; 

export const useSupabaseData = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        let user = WebApp?.initDataUnsafe?.user;
        let telegram_id: number;
        let user_email: string;
        let username: string | undefined;

        if (user) {
          telegram_id = user.id;
          username = user.username;
          user_email = `${user.username || `user${user.id}`}@telegram.io`;
        } else if (import.meta.env.DEV) {
          console.warn('Telegram user not found, using mock data for local development');
          telegram_id = 5701645456;
          username = 'dmitrijvatutov';
          user_email = `dmitrijvatutov@telegram.io`;
        } else {
          throw new Error('Пожалуйста, откройте приложение внутри Telegram');
        }

        // 1. Получаем профиль через наш backend API
        try {
          const profileResponse = await fetch(`${API_URL}/profile`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': API_KEY,
              'x-telegram-init-data': WebApp?.initData || ''
            },
            body: JSON.stringify({
              telegram_id,
              username
            })
          });

          if (!profileResponse.ok) {
            throw new Error('API profile fetch failed');
          }

          const profileData = await profileResponse.json();
          if (profileData.success) {
            setProfile({
              credits: profileData.credits,
              current_streak: profileData.current_streak,
              total_generations: profileData.total_generations
            });
          }
        } catch (apiError) {
          console.warn('Backend API not ready or failed, falling back to direct Supabase fetch:', apiError);
          // Fallback to direct Supabase query
          const { data: profileData, error: profileError } = await supabase
            .from('users_credits')
            .select('credits, current_streak, total_generations')
            .eq('telegram_id', telegram_id)
            .single();

          if (!profileError && profileData) {
            setProfile(profileData);
          }
        }

        // 2. Получаем квизы через Supabase (оставляем пока как есть для истории тестов)
        const { data: quizzesData, error: quizzesError } = await supabase
          .from('quizzes')
          .select('id, title, created_at, questions')
          .eq('owner_email', user_email)
          .order('created_at', { ascending: false })
          .limit(10);

        if (quizzesError) throw quizzesError;
        setQuizzes(quizzesData || []);

      } catch (err: any) {
        console.error('Fetch error:', err);
        if (err.code !== 'PGRST116') { 
            setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { profile, quizzes, loading, error };
};
