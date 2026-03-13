import { useEffect, useState } from 'react';
import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import WebApp from '@twa-dev/sdk';
import { Zap, BookOpen, PlusCircle, Loader2 } from 'lucide-react';
import { useSupabaseData } from '../hooks/useSupabaseData';

const Dashboard: FC = () => {
  const { profile, quizzes, loading, error } = useSupabaseData();
  const [firstName, setFirstName] = useState('Студент');
  const navigate = useNavigate();

  useEffect(() => {
    if (WebApp?.initDataUnsafe?.user?.first_name) {
      setFirstName(WebApp.initDataUnsafe.user.first_name);
    }
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '80vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '10px' }}>
        <Loader2 className="animate-spin" size={32} color="var(--color-primary)" />
        <p className="text-muted">Загружаем ваши успехи...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <header style={{ marginBottom: '10px' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>
          Привет, {firstName}! 👋
        </h1>
        <p className="text-muted" style={{ fontSize: '14px' }}>Добро пожаловать в VYUD AI.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <Card style={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <Zap size={28} color="var(--color-primary)" style={{ marginBottom: '8px' }} />
          <h3 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0' }}>{profile?.credits ?? 0}</h3>
          <p className="text-muted" style={{ fontSize: '12px', margin: '0' }}>Кредитов</p>
        </Card>

        <Card style={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ 
            background: 'var(--color-danger)', color: 'white', 
            borderRadius: '50%', width: '28px', height: '28px', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '8px', fontWeight: 'bold', fontSize: '14px'
          }}>🔥</div>
          <h3 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0' }}>{profile?.current_streak ?? 0}</h3>
          <p className="text-muted" style={{ fontSize: '12px', margin: '0' }}>Стрик (дней)</p>
        </Card>
      </div>

      <Card style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%)', color: 'white', border: 'none' }}>
        <CardHeader style={{ marginBottom: '12px' }}>
          <CardTitle style={{ color: 'white' }}>Новый тест</CardTitle>
          <CardDescription style={{ color: 'rgba(255,255,255,0.8)' }}>
            Загрузи PDF или текст, и AI создаст для тебя интерактивный курс.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => navigate('/create')}
            style={{ backgroundColor: 'white', color: 'var(--color-primary)' }} 
            fullWidth
          >
            <PlusCircle size={18} style={{ marginRight: '8px' }} />
            Создать сейчас
          </Button>
        </CardContent>
      </Card>

      <div>
        <h2 style={{ fontSize: '18px', marginBottom: '12px' }}>Мои последние тесты</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {quizzes.length > 0 ? quizzes.map((quiz) => (
            <Card 
              key={quiz.id} 
              onClick={() => navigate(`/course/${quiz.id}`)}
              style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }}
            >
              <div style={{ background: 'var(--color-primary-light)', padding: '10px', borderRadius: '10px' }}>
                <BookOpen size={20} color="var(--color-primary)" />
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '16px' }}>{quiz.title}</h4>
                <p className="text-muted" style={{ margin: 0, fontSize: '12px' }}>
                  {new Date(quiz.created_at).toLocaleDateString('ru-RU')}
                </p>
              </div>
            </Card>
          )) : (
            <p className="text-muted" style={{ textAlign: 'center', padding: '20px' }}>
              У вас пока нет созданных тестов.
            </p>
          )}
        </div>
      </div>

      {error && (
        <div style={{ color: 'var(--color-danger)', fontSize: '12px', textAlign: 'center', marginTop: '20px' }}>
          ⚠️ Ошибка синхронизации: {error}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
