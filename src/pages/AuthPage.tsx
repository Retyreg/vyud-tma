import { useState } from 'react';
import type { FC } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { isTMA } from '../lib/telegram';
import { useAuthContext } from '../contexts/AuthContext';
import { AlertCircle, Loader2 } from 'lucide-react';

const AuthPage: FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // TMA users and already-authenticated users never see /auth
  if (isTMA() || user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
        navigate('/');
      } else {
        const { error: authError } = await supabase.auth.signUp({ email, password });
        if (authError) throw authError;
        setSuccess('Аккаунт создан! Теперь войдите с вашим email и паролем.');
      }
    } catch (e: any) {
      const msg = e.message || 'Ошибка авторизации';
      if (msg.includes('Invalid login')) setError('Неверный email или пароль');
      else if (msg.includes('already registered')) setError('Email уже зарегистрирован');
      else setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px', borderRadius: '10px',
    border: '1px solid var(--border)', fontSize: '15px',
    background: 'var(--bg)', color: 'var(--text)',
    outline: 'none', boxSizing: 'border-box',
    fontFamily: 'inherit',
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', background: 'var(--bg)',
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span style={{ fontSize: '48px' }}>⚡</span>
          <h1 style={{ margin: '8px 0 4px', fontSize: '26px', color: 'var(--primary)' }}>VYUD AI</h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
            Платформа для генерации тестов из документов
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)', marginBottom: '24px' }}>
          {(['login', 'register'] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(null); setSuccess(null); }}
              style={{
                flex: 1, padding: '12px', fontSize: '15px', fontWeight: 700,
                border: 'none', cursor: 'pointer',
                background: mode === m ? 'var(--primary)' : 'var(--card)',
                color: mode === m ? 'white' : 'var(--text-secondary)',
              }}
            >
              {m === 'login' ? 'Войти' : 'Регистрация'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
              Email
            </label>
            <input
              type="email" required value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
              Пароль
            </label>
            <input
              type="password" required value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Минимум 6 символов"
              minLength={6}
              style={inputStyle}
            />
          </div>

          {error && (
            <div style={{ display: 'flex', gap: '8px', padding: '10px 12px', borderRadius: '8px', background: 'rgba(239,68,68,0.06)', border: '1px solid var(--error)' }}>
              <AlertCircle size={16} color="var(--error)" style={{ flexShrink: 0, marginTop: '1px' }} />
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--error)' }}>{error}</p>
            </div>
          )}

          {success && (
            <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'rgba(34,197,94,0.08)', border: '1px solid var(--success)' }}>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--success)' }}>{success}</p>
            </div>
          )}

          <button
            type="submit" disabled={loading}
            style={{
              padding: '13px', borderRadius: '12px', fontWeight: 700, fontSize: '15px',
              background: 'var(--primary)', color: 'white', border: 'none',
              cursor: loading ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              opacity: loading ? 0.8 : 1,
            }}
          >
            {loading ? <><Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Подождите...</> : mode === 'login' ? 'Войти' : 'Создать аккаунт'}
          </button>
        </form>

        <p style={{ marginTop: '24px', textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)' }}>
          Или откройте приложение в{' '}
          <a href="https://t.me/VyudAiBot" style={{ color: 'var(--primary)', fontWeight: 600 }}>@VyudAiBot</a>{' '}
          — авторизация автоматическая
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
