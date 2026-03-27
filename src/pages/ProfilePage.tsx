import { useEffect, useState } from 'react';
import type { FC } from 'react';
import { Card } from '../components/ui/Card';
import { Loader2, Zap, Flame, BookOpen, Star } from 'lucide-react';
import { useSupabaseData } from '../hooks/useSupabaseData';
import WebApp from '@twa-dev/sdk';

const ProfilePage: FC = () => {
  const { profile, loading } = useSupabaseData();
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const user = WebApp?.initDataUnsafe?.user;
    if (user) {
      setUserName(user.first_name + (user.last_name ? ' ' + user.last_name : ''));
    }
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '60vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '10px' }}>
        <Loader2 className="animate-spin" size={32} color="var(--color-primary)" />
        <p className="text-muted">Загрузка профиля...</p>
      </div>
    );
  }

  const stats = [
    { icon: <Zap size={20} color="var(--color-primary)" />, label: 'Кредитов', value: profile?.credits ?? 0 },
    { icon: <Flame size={20} color="var(--color-danger)" />, label: 'Дней подряд', value: profile?.current_streak ?? 0 },
    { icon: <BookOpen size={20} color="#22c55e" />, label: 'Тестов создано', value: profile?.total_generations ?? 0 },
  ];

  const user = WebApp?.initDataUnsafe?.user;
  const username = user?.username ? `@${user.username}` : '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h1 style={{ fontSize: '22px', margin: 0 }}>Профиль</h1>

      <Card style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{
          width: '64px', height: '64px', borderRadius: '50%',
          background: 'var(--color-primary)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          fontSize: '28px', flexShrink: 0,
        }}>
          {userName?.[0] || '?'}
        </div>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: '18px' }}>{userName || 'Пользователь'}</h2>
          {username && <p className="text-muted" style={{ margin: 0, fontSize: '13px' }}>{username}</p>}
          {user?.is_premium && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#f59e0b', fontWeight: 700, marginTop: '4px' }}>
              <Star size={12} /> Telegram Premium
            </span>
          )}
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
        {stats.map((s) => (
          <Card key={s.label} style={{ padding: '14px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            {s.icon}
            <span style={{ fontSize: '22px', fontWeight: 800 }}>{s.value}</span>
            <span className="text-muted" style={{ fontSize: '10px' }}>{s.label}</span>
          </Card>
        ))}
      </div>

      <Card style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--tg-theme-secondary-bg-color)' }}>
        <p style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>Как получить кредиты?</p>
        <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: 'var(--tg-theme-hint-color)', lineHeight: 1.8 }}>
          <li>Купить пакет через Telegram Stars ⭐</li>
          <li>Пригласить друга (+2 тебе, +1 другу)</li>
          <li>Ударный режим: +1 бонус каждые 5 дней</li>
        </ul>
      </Card>
    </div>
  );
};

export default ProfilePage;
