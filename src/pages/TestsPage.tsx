import { useEffect, useState } from 'react';
import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../contexts/AuthContext';
import { BookOpen, Loader2, ChevronRight, Plus } from 'lucide-react';

interface Quiz {
  id: string;
  title: string;
  created_at: string;
  questions: any;
}

const TestsPage: FC = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) return;
    const load = async () => {
      try {
        const { data } = await supabase
          .from('quizzes')
          .select('id, title, created_at, questions')
          .eq('email', user.email)
          .order('created_at', { ascending: false });
        setQuizzes(data || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.email]);

  const getCount = (questions: any): number => {
    if (Array.isArray(questions)) return questions.length;
    if (typeof questions === 'string') {
      try { return JSON.parse(questions).length; } catch { return 0; }
    }
    return 0;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '60vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px' }}>
        <Loader2 size={32} color="var(--primary)" style={{ animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Загружаем тесты...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: '22px', margin: 0 }}>Мои тесты</h1>
        <button
          onClick={() => navigate('/')}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 14px', borderRadius: '20px',
            background: 'var(--primary)', color: 'white',
            border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '13px',
          }}
        >
          <Plus size={14} /> Создать
        </button>
      </div>

      {quizzes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '52px' }}>📭</span>
          <div>
            <p style={{ margin: '0 0 6px', fontWeight: 700, fontSize: '16px' }}>Тестов пока нет</p>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>Загрузите первый файл и AI создаст тест за 30 секунд</p>
          </div>
          <button
            onClick={() => navigate('/')}
            style={{ padding: '12px 24px', borderRadius: '12px', background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 700 }}
          >
            Создать первый тест
          </button>
        </div>
      ) : (
        quizzes.map((quiz) => {
          const count = getCount(quiz.questions);
          return (
            <div
              key={quiz.id}
              onClick={() => navigate(`/test/${quiz.id}`)}
              style={{
                display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px',
                borderRadius: '12px', border: '1px solid var(--border)',
                background: 'var(--tg-theme-secondary-bg-color, var(--card))',
                cursor: 'pointer',
              }}
            >
              <div style={{ background: 'var(--primary-light)', padding: '10px', borderRadius: '10px', flexShrink: 0 }}>
                <BookOpen size={20} color="var(--primary)" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={{ margin: '0 0 4px', fontSize: '15px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {quiz.title}
                </h4>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {count > 0 ? `${count} вопросов · ` : ''}
                  {new Date(quiz.created_at).toLocaleDateString('ru-RU')}
                </p>
              </div>
              <ChevronRight size={18} color="var(--text-secondary)" />
            </div>
          );
        })
      )}
    </div>
  );
};

export default TestsPage;
