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

// ВАШ ID для тестов в браузере (подставьте свой, чтобы видеть свои данные в Chrome)
const MOCK_USER_ID = 485123456; 

export const useSupabaseData = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Пытаемся получить пользователя из Telegram
        let user = WebApp?.initDataUnsafe?.user;
        let telegram_id: number;
        let user_email: string;

        if (user) {
          telegram_id = user.id;
          user_email = `${user.username || `user${user.id}`}@telegram.io`;
        } else {
          // Если мы в браузере (не в Telegram), используем Mock-данные
          console.warn('Telegram user not found, using mock data for development');
          telegram_id = MOCK_USER_ID;
          user_email = `dmitrijvatutov@telegram.io`; // Замените на вашу почту из Supabase если нужно
        }

        // 1. Получаем профиль
        const { data: profileData, error: profileError } = await supabase
          .from('users_credits')
          .select('credits, current_streak, total_generations')
          .eq('telegram_id', telegram_id)
          .single();

        if (profileError && profileData) throw profileError;
        setProfile(profileData);

        // 2. Получаем квизы (ищем и по email, и по id для надежности)
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
        // Не блокируем интерфейс ошибкой, если данных просто нет (новый пользователь)
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
