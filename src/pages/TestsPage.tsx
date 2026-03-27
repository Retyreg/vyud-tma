import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { BookOpen, Loader2, ChevronRight } from 'lucide-react';
import { useSupabaseData } from '../hooks/useSupabaseData';

const TestsPage: FC = () => {
  const { quizzes, loading } = useSupabaseData();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '60vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '10px' }}>
        <Loader2 className="animate-spin" size={32} color="var(--color-primary)" />
        <p className="text-muted">Загружаем тесты...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h1 style={{ fontSize: '22px', margin: 0 }}>Мои тесты</h1>

      {quizzes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '48px' }}>📭</span>
          <p className="text-muted">У вас пока нет тестов.<br />Создайте первый!</p>
        </div>
      ) : (
        quizzes.map((quiz) => {
          const count = Array.isArray(quiz.questions)
            ? quiz.questions.length
            : typeof quiz.questions === 'string'
            ? (() => { try { return JSON.parse(quiz.questions).length; } catch { return 0; } })()
            : 0;

          return (
            <Card
              key={quiz.id}
              onClick={() => navigate(`/course/${quiz.id}`)}
              style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }}
            >
              <div style={{ background: 'var(--color-primary-light)', padding: '10px', borderRadius: '10px', flexShrink: 0 }}>
                <BookOpen size={20} color="var(--color-primary)" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={{ margin: '0 0 4px', fontSize: '15px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {quiz.title}
                </h4>
                <p className="text-muted" style={{ margin: 0, fontSize: '12px' }}>
                  {count > 0 ? `${count} вопросов • ` : ''}
                  {new Date(quiz.created_at).toLocaleDateString('ru-RU')}
                </p>
              </div>
              <ChevronRight size={18} color="var(--tg-theme-hint-color)" />
            </Card>
          );
        })
      )}
    </div>
  );
};

export default TestsPage;
