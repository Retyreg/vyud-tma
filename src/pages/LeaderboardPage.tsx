import { useEffect, useState } from 'react';
import type { FC } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../contexts/AuthContext';

interface LeaderEntry {
  telegram_id: number | null;
  username: string | null;
  first_name: string | null;
  email: string;
  total_generations: number;
  current_streak: number;
}

type Tab = 'generations' | 'streak';

const MEDAL = ['🥇', '🥈', '🥉'];

function displayName(e: LeaderEntry): string {
  if (e.first_name) return e.first_name;
  if (e.username) return `@${e.username}`;
  return e.email.split('@')[0];
}

function avatarLetter(e: LeaderEntry): string {
  return (displayName(e)[0] ?? '?').toUpperCase();
}

const LeaderboardPage: FC = () => {
  const { user } = useAuthContext();
  const [tab, setTab] = useState<Tab>('generations');
  const [entries, setEntries] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const col = tab === 'generations' ? 'total_generations' : 'current_streak';
    supabase
      .from('users_credits')
      .select('telegram_id, username, first_name, email, total_generations, current_streak')
      .order(col, { ascending: false })
      .gt(col, 0)
      .limit(20)
      .then(({ data }) => {
        setEntries((data as LeaderEntry[]) ?? []);
        setLoading(false);
      });
  }, [tab]);

  const isMe = (e: LeaderEntry) =>
    user?.telegram_id
      ? e.telegram_id === user.telegram_id
      : e.email === user?.email;

  const myRank = entries.findIndex(isMe) + 1;
  const score = (e: LeaderEntry) =>
    tab === 'generations' ? e.total_generations : e.current_streak;

  return (
    <div style={{ paddingBottom: 8 }}>
      <h2 style={{ margin: '0 0 4px', fontSize: 20 }}>Лидерборд</h2>
      <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--text-secondary)' }}>
        Топ пользователей VYUD AI
      </p>

      {/* Tabs */}
      <div style={{
        display: 'flex', borderRadius: 12, overflow: 'hidden',
        border: '1px solid var(--border)', marginBottom: 16,
      }}>
        {([['generations', '⚡ Генерации'], ['streak', '🔥 Стрики']] as [Tab, string][]).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1, padding: '10px', fontSize: 13, fontWeight: 700,
              border: 'none', cursor: 'pointer',
              background: tab === t ? 'var(--primary)' : 'var(--card)',
              color: tab === t ? 'white' : 'var(--text-secondary)',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* My position */}
      {myRank > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 6, marginBottom: 12, padding: '8px 14px',
          background: 'var(--primary-light)', borderRadius: 10,
          fontSize: 13, color: 'var(--primary)', fontWeight: 600,
        }}>
          {myRank <= 3 ? MEDAL[myRank - 1] : `#${myRank}`} Ваше место в топе
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-secondary)', fontSize: 14 }}>
          Загрузка…
        </div>
      ) : entries.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-secondary)', fontSize: 14 }}>
          Пока нет данных
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {entries.map((e, i) => {
            const me = isMe(e);
            return (
              <div
                key={e.telegram_id ?? e.email}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px', borderRadius: 14,
                  background: me ? 'var(--primary-light)' : 'var(--card)',
                  border: `1.5px solid ${me ? 'var(--primary)' : 'var(--border)'}`,
                }}
              >
                {/* Rank */}
                <div style={{
                  width: 28, textAlign: 'center', flexShrink: 0,
                  fontSize: i < 3 ? 20 : 13, fontWeight: 700,
                  color: 'var(--text-secondary)',
                }}>
                  {i < 3 ? MEDAL[i] : i + 1}
                </div>

                {/* Avatar */}
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  background: me ? 'var(--primary)' : 'var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 15, fontWeight: 700,
                  color: me ? 'white' : 'var(--text-secondary)',
                }}>
                  {avatarLetter(e)}
                </div>

                {/* Name */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: 600, fontSize: 14,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    color: me ? 'var(--primary)' : 'var(--text)',
                  }}>
                    {displayName(e)}{me ? ' (вы)' : ''}
                  </div>
                </div>

                {/* Score */}
                <div style={{ flexShrink: 0, textAlign: 'right' }}>
                  <span style={{ fontWeight: 700, fontSize: 16, color: me ? 'var(--primary)' : 'var(--text)' }}>
                    {score(e)}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)', marginLeft: 3 }}>
                    {tab === 'generations' ? 'тест.' : 'дн.'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LeaderboardPage;
