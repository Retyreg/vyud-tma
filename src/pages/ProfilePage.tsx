import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import { Zap, BookOpen, Star, LogOut, CreditCard, Calendar } from 'lucide-react';
import { isTMA } from '../lib/telegram';

const ProfilePage: FC = () => {
  const { user, signOut } = useAuthContext();
  const navigate = useNavigate();
  const telegramMode = isTMA();

  if (!user) return null;

  const initials = (user.first_name || user.email || '?')[0].toUpperCase();
  const displayName = user.first_name || user.username || user.email.split('@')[0];
  const joinDate = user.created_at ? new Date(user.created_at).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long' }) : '—';

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h1 style={{ fontSize: '22px', margin: 0 }}>Профиль</h1>

      {/* User card */}
      <div style={{
        padding: '20px', borderRadius: '16px',
        background: 'linear-gradient(135deg, var(--primary) 0%, #8b5cf6 100%)',
        color: 'white', display: 'flex', alignItems: 'center', gap: '16px',
      }}>
        <div style={{
          width: '60px', height: '60px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '26px', fontWeight: 700, flexShrink: 0,
        }}>
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ margin: '0 0 4px', fontSize: '18px', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {displayName}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {user.username && (
              <span style={{ fontSize: '13px', opacity: 0.85 }}>@{user.username}</span>
            )}
            {!telegramMode && (
              <span style={{ fontSize: '12px', opacity: 0.7 }}>{user.email}</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', padding: '2px 10px', borderRadius: '20px', background: 'rgba(255,255,255,0.2)', fontWeight: 600 }}>
              {user.tariff.toUpperCase()}
            </span>
            {user.is_premium && (
              <span style={{ fontSize: '11px', padding: '2px 10px', borderRadius: '20px', background: 'rgba(251,191,36,0.35)', color: '#fbbf24', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Star size={10} fill="#fbbf24" /> Premium
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Credits big */}
      <div style={{
        padding: '20px', borderRadius: '16px', textAlign: 'center',
        background: 'var(--tg-theme-secondary-bg-color, var(--card))',
        border: '1px solid var(--border)',
      }}>
        <Zap size={28} color="var(--primary)" />
        <div style={{ fontSize: '52px', fontWeight: 900, color: 'var(--primary)', lineHeight: 1.1, margin: '4px 0' }}>
          {user.credits}
        </div>
        <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>кредитов доступно</div>
        <button
          onClick={() => {/* TODO: payment */}}
          style={{
            marginTop: '14px', padding: '10px 24px', borderRadius: '20px',
            background: 'var(--primary)', color: 'white', border: 'none',
            cursor: 'pointer', fontWeight: 700, fontSize: '14px',
            display: 'inline-flex', alignItems: 'center', gap: '6px',
          }}
        >
          <CreditCard size={14} /> Пополнить
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {[
          { icon: <BookOpen size={18} color="var(--primary)" />, label: 'Тестов создано', value: user.total_generations },
          { icon: <Calendar size={18} color="#8b5cf6" />, label: 'Зарегистрирован', value: joinDate },
        ].map((s) => (
          <div key={s.label} style={{
            padding: '16px', borderRadius: '12px',
            background: 'var(--tg-theme-secondary-bg-color, var(--card))',
            border: '1px solid var(--border)',
            display: 'flex', flexDirection: 'column', gap: '6px',
          }}>
            {s.icon}
            <div style={{ fontSize: '20px', fontWeight: 800 }}>{s.value}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Sign out — browser only */}
      {!telegramMode && (
        <button
          onClick={handleSignOut}
          style={{
            padding: '13px', borderRadius: '12px', fontWeight: 700, fontSize: '14px',
            background: 'rgba(239,68,68,0.06)', color: 'var(--error)',
            border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}
        >
          <LogOut size={16} /> Выйти из аккаунта
        </button>
      )}
    </div>
  );
};

export default ProfilePage;
