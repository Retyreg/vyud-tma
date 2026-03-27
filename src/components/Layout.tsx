import type { FC } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import BottomNav from './BottomNav';
import { Zap } from 'lucide-react';

const HIDE_HEADER_PATHS = ['/test/'];
const HIDE_NAV_PATHS = ['/test/', '/auth'];

const Layout: FC = () => {
  const { user } = useAuthContext();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const hideHeader = HIDE_HEADER_PATHS.some((p) => pathname.startsWith(p));
  const hideNav = HIDE_NAV_PATHS.some((p) => pathname.startsWith(p));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {!hideHeader && (
        <header style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px',
          background: 'var(--tg-theme-bg-color, var(--card))',
          borderBottom: '1px solid var(--border)',
          position: 'sticky', top: 0, zIndex: 50,
        }}>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}
          >
            <span style={{ fontSize: '22px' }}>⚡</span>
            <span style={{ fontWeight: 800, fontSize: '17px', color: 'var(--primary)' }}>VYUD AI</span>
          </button>

          {user && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'var(--primary-light)',
              borderRadius: '20px', padding: '5px 12px',
            }}>
              <Zap size={14} color="var(--primary)" />
              <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--primary)' }}>
                {user.credits}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>кредитов</span>
            </div>
          )}
        </header>
      )}

      <main style={{ flex: 1, padding: hideNav ? '0' : '16px 16px 76px', maxWidth: '480px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        <Outlet />
      </main>

      {!hideNav && <BottomNav />}
    </div>
  );
};

export default Layout;
