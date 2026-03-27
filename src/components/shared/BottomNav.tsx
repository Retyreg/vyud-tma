import type { FC } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const TABS = [
  { path: '/', label: 'Главная', icon: '🏠' },
  { path: '/create', label: 'Создать', icon: '✨' },
  { path: '/tests', label: 'Тесты', icon: '📚' },
  { path: '/profile', label: 'Профиль', icon: '👤' },
];

const BottomNav: FC = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: '60px',
      background: 'var(--tg-theme-bg-color)',
      borderTop: '1px solid var(--color-border)',
      display: 'flex',
      zIndex: 100,
    }}>
      {TABS.map((tab) => {
        const active = pathname === tab.path || (tab.path !== '/' && pathname.startsWith(tab.path));
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '6px 0',
              color: active ? 'var(--color-primary)' : 'var(--tg-theme-hint-color)',
            }}
          >
            <span style={{ fontSize: '20px', lineHeight: 1 }}>{tab.icon}</span>
            <span style={{ fontSize: '10px', fontWeight: active ? 700 : 400 }}>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNav;
