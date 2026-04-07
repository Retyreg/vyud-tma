import type { FC } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const TABS = [
  { path: '/', label: 'Главная', icon: '🏠', exact: true },
  { path: '/leaderboard', label: 'Топ', icon: '🏆', exact: false },
  { path: '/tests', label: 'Тесты', icon: '📚', exact: false },
  { path: '/graph', label: 'Граф', icon: '🧠', exact: false },
  { path: '/profile', label: 'Профиль', icon: '👤', exact: false },
];

const BottomNav: FC = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const isActive = (tab: typeof TABS[number]) =>
    tab.exact ? pathname === tab.path : pathname.startsWith(tab.path);

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, height: '60px',
      background: 'var(--tg-theme-bg-color, var(--card))',
      borderTop: '1px solid var(--border)',
      display: 'flex', zIndex: 100,
      maxWidth: '480px', margin: '0 auto',
    }}>
      {TABS.map((tab) => {
        const active = isActive(tab);
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: '2px',
              background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0',
              color: active ? 'var(--primary)' : 'var(--text-secondary)',
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
