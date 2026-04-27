import { useEffect, useMemo, useState } from 'react';
import type { FC } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { LmsOrg } from '../api/lms';
import { useAuthContext } from '../contexts/AuthContext';
import { fetchMyAssignments } from '../api/sop';

const EMPLOYEE_TABS = [
  { path: '/', label: 'Регламенты', icon: '📋', exact: true },
  { path: '/my-progress', label: 'Прогресс', icon: '🎯', exact: false },
  { path: '/org-leaderboard', label: 'Топ', icon: '🏆', exact: false },
  { path: '/templates', label: 'Шаблоны', icon: '📄', exact: false },
  { path: '/profile', label: 'Профиль', icon: '👤', exact: false },
];

const MANAGER_TABS = [
  { path: '/', label: 'Регламенты', icon: '📋', exact: true },
  { path: '/dashboard', label: 'Дашборд', icon: '📊', exact: false },
  { path: '/templates', label: 'Шаблоны', icon: '📄', exact: false },
  { path: '/my-progress', label: 'Прогресс', icon: '🎯', exact: false },
  { path: '/profile', label: 'Профиль', icon: '👤', exact: false },
];

const BottomNav: FC = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user } = useAuthContext();
  const [pendingCount, setPendingCount] = useState(0);

  const org = useMemo<LmsOrg | null>(() => {
    try {
      const cached = localStorage.getItem('vyud_org');
      return cached ? JSON.parse(cached) : null;
    } catch { return null; }
  }, [pathname]);

  const isManager = Boolean(org?.is_manager);
  const userKey = user?.telegram_id ? String(user.telegram_id) : null;

  useEffect(() => {
    if (!userKey || !org || isManager) { setPendingCount(0); return; }
    fetchMyAssignments(org.org_id, userKey)
      .then((arr) => setPendingCount(arr.filter((a) => !a.completed).length))
      .catch(() => setPendingCount(0));
  }, [userKey, isManager, org?.org_id, pathname]);

  const TABS = isManager ? MANAGER_TABS : EMPLOYEE_TABS;

  const isActive = (tab: (typeof EMPLOYEE_TABS)[number]) =>
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
        const showBadge = !isManager && tab.path === '/' && pendingCount > 0;
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: '2px',
              background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0',
              color: active ? 'var(--primary)' : 'var(--text-secondary)',
              position: 'relative',
            }}
          >
            <span style={{ fontSize: '20px', lineHeight: 1, position: 'relative' }}>
              {tab.icon}
              {showBadge && (
                <span style={{
                  position: 'absolute', top: -2, right: -10,
                  minWidth: 16, height: 16, padding: '0 4px',
                  borderRadius: 8, background: '#dc2626',
                  color: 'white', fontSize: 10, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  lineHeight: 1,
                }}>
                  {pendingCount > 9 ? '9+' : pendingCount}
                </span>
              )}
            </span>
            <span style={{ fontSize: '10px', fontWeight: active ? 700 : 400 }}>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNav;
