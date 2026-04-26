import { useEffect, useState } from 'react';
import type { FC } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { fetchOrgLeaderboard } from '../api/sop';
import type { LeaderboardEntry } from '../api/sop';
import type { LmsOrg } from '../api/lms';
import { Loader2 } from 'lucide-react';

const MEDALS = ['🥇', '🥈', '🥉'];

const OrgLeaderboardPage: FC = () => {
  const { user } = useAuthContext();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [orgName, setOrgName] = useState('');

  const userKey = user?.telegram_id ? String(user.telegram_id) : null;

  const org: LmsOrg | null = (() => {
    try {
      const cached = localStorage.getItem('vyud_org');
      return cached ? JSON.parse(cached) : null;
    } catch { return null; }
  })();

  useEffect(() => {
    if (!userKey || !org) { setLoading(false); return; }
    fetchOrgLeaderboard(org.org_id, userKey)
      .then((data) => { setOrgName(data.org_name); setEntries(data.entries); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [userKey]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: 12 }}>
        <Loader2 size={32} color="var(--primary)" style={{ animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  if (error || !org) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <p style={{ color: 'var(--error)', fontSize: 14 }}>{error || 'Организация не найдена'}</p>
      </div>
    );
  }

  const me = entries.find((e) => e.is_me);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h1 style={{ fontSize: 20, margin: '0 0 4px', fontWeight: 700 }}>Топ команды</h1>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 13 }}>{orgName}</p>
      </div>

      {/* My rank card */}
      {me && (
        <div style={{
          borderRadius: 14, padding: '14px 18px',
          background: 'var(--primary-light)', border: '1px solid var(--primary)',
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <span style={{ fontSize: 28 }}>{MEDALS[me.rank - 1] ?? `#${me.rank}`}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>Вы</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {me.completed}/{me.total} регламентов
              {me.avg_score_pct !== null ? ` · ${me.avg_score_pct}%` : ''}
            </div>
          </div>
          <div style={{ fontWeight: 900, fontSize: 24, color: 'var(--primary)' }}>
            #{me.rank}
          </div>
        </div>
      )}

      {/* Full list */}
      {entries.length === 0 ? (
        <div style={{ padding: '40px 0', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Пока нет данных</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {entries.map((entry) => (
            <div
              key={entry.user_key}
              style={{
                padding: '12px 16px', borderRadius: 14,
                border: entry.is_me ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                background: entry.is_me ? 'var(--primary-light)' : 'var(--tg-theme-secondary-bg-color, var(--card))',
                display: 'flex', alignItems: 'center', gap: 12,
              }}
            >
              <span style={{ fontSize: 22, minWidth: 28, textAlign: 'center' }}>
                {MEDALS[entry.rank - 1] ?? `${entry.rank}`}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {entry.display_name ?? entry.user_key}
                  {entry.is_me && <span style={{ fontSize: 11, color: 'var(--primary)', marginLeft: 6 }}>вы</span>}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                  {entry.completed}/{entry.total}
                  {entry.avg_score_pct !== null ? ` · ${entry.avg_score_pct}%` : ''}
                </div>
              </div>
              {/* Progress bar */}
              <div style={{ width: 48, height: 6, borderRadius: 4, background: 'var(--border)', flexShrink: 0 }}>
                <div style={{
                  height: '100%', borderRadius: 4, background: 'var(--primary)',
                  width: entry.total > 0 ? `${Math.round(entry.completed / entry.total * 100)}%` : '0%',
                }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrgLeaderboardPage;
