import { useEffect, useState } from 'react';
import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import WebApp from '@twa-dev/sdk';
import { Zap, BookOpen, PlusCircle, Loader2, CreditCard } from 'lucide-react';
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

  const handleBuyCredits = () => {
    try {
      WebApp.showConfirm("Хотите перейти в меню покупки кредитов?", (ok) => {
        if (ok) {
          WebApp.close();
        }
      });
    } catch (e) {
      window.location.href = "https://t.me/VyudAiBot";
    }
  };

  const renderStreakProgress = () => {
    const currentStreak = profile?.current_streak || 0;
    const maxStreak = 5;
    const progress = currentStreak % maxStreak;
    const daysLeft = maxStreak - progress;

    return (
      <Card style={{ padding: '16px', background: 'var(--color-surface)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>🔥</span>
            <span style={{ fontWeight: 'bold' }}>Ударный режим: {currentStreak} дней</span>
          </div>
          <span className="text-muted" style={{ fontSize: '12px' }}>
            {progress === 0 && currentStreak > 0 ? 'Бонус получен!' : `Осталось ${daysLeft} ${daysLeft === 1 ? 'день' : daysLeft > 1 && daysLeft < 5 ? 'дня' : 'дней'}`}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
          {[...Array(maxStreak)].map((_, index) => (
            <div 
              key={index}
              style={{
                flex: 1,
                height: '8px',
                borderRadius: '4px',
                background: index < progress || (progress === 0 && currentStreak > 0) 
                  ? 'var(--color-danger)' 
                  : 'var(--color-border)',
                transition: 'background-color 0.3s ease'
              }}
            />
          ))}
        </div>
        <div style={{ marginTop: '8px', fontSize: '12px', textAlign: 'right', color: 'var(--color-primary)' }}>
          🎁 +1 бонусный кредит каждые 5 дней!
        </div>
      </Card>
    );
  };

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
      <header style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>
            Привет, {firstName}! 👋
          </h1>
          <p className="text-muted" style={{ fontSize: '14px' }}>Добро пожаловать в VYUD AI.</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleBuyCredits} style={{ borderRadius: '20px', padding: '6px 12px' }}>
          <CreditCard size={14} style={{ marginRight: '6px' }} />
          Пополнить
        </Button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
        <Card style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
             <p className="text-muted" style={{ fontSize: '12px', margin: '0 0 4px 0' }}>Доступно</p>
             <h3 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0', display: 'flex', alignItems: 'center', gap: '8px' }}>
               <Zap size={24} color="var(--color-primary)" />
               {profile?.credits ?? 0} <span style={{fontSize: '16px', fontWeight: 'normal'}}>кредитов</span>
             </h3>
          </div>
        </Card>
      </div>

      {renderStreakProgress()}

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
