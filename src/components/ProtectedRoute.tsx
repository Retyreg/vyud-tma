import type { FC } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import { isTMA } from '../lib/telegram';

const ProtectedRoute: FC = () => {
  const { user, loading } = useAuthContext();

  if (loading) {
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
