import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import { isTMA } from '../lib/telegram';

const ProtectedRoute: FC = () => {
  const { user, loading } = useAuthContext();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => setTimedOut(true), 5000);
    return () => clearTimeout(t);
  }, [loading]);

  if (loading) {
    if (timedOut) {
      return (
        <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Что-то пошло не так...</p>
          <button onClick={() => window.location.reload()} style={{ padding: '10px 20px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
            Обновить страницу
          </button>
        </div>
      );
    }
    return (
      <div style={{
        display: 'flex', height: '100vh', alignItems: 'center',
        justifyContent: 'center', flexDirection: 'column', gap: '12px',
      }}>
        <div style={{
          width: '40px', height: '40px', border: '3px solid var(--border)',
          borderTopColor: 'var(--primary)', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Загрузка...</p>
      </div>
    );
  }

  // TMA mode — always allow (no auth required)
  if (isTMA()) return <Outlet />;

  // Browser mode — require auth session
  if (!user) return <Navigate to="/auth" replace />;

  return <Outlet />;
};

export default ProtectedRoute;
