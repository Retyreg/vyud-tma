import { useEffect, useState } from 'react';
import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import { fetchMyProgress } from '../api/sop';
import type { MyProgressItem } from '../api/sop';
import type { LmsOrg } from '../api/lms';
import { Loader2 } from 'lucide-react';

const MyProgressPage: FC = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<MyProgressItem[]>([]);
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
    fetchMyProgress(org.org_id, userKey)
      .then((data) => { setOrgName(data.org_name); setItems(data.items); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [userKey]);

  const completed = items.filter((i) => i.completed);
  const total = items.length;

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: 12 }}>
        <Loader2 size={32} color="var(--primary)" style={{ animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <p style={{ color: 'var(--error)', fontSize: 14 }}>{error}</p>
      </div>
    );
  }

  if (!org) {
    return (
      <div style={{ padding: 32, textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Организация не найдена.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 20, margin: '0 0 4px', fontWeight: 700 }}>Мой прогресс</h1>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 13 }}>{orgName}</p>
      </div>

      {/* Summary */}
      <div style={{
        borderRadius: 14, padding: '16px 20px',
        background: 'var(--primary-light)', border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <span style={{ fontSize: 36 }}>🎯</span>
        <div>
          <div style={{ fontWeight: 800, fontSize: 22, color: 'var(--primary)' }}>
            {completed.length} из {total}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
            регламентов пройдено
          </div>
        </div>
        {total > 0 && (
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontWeight: 800, fontSize: 20, color: 'var(--primary)' }}>
              {Math.round(completed.length / total * 100)}%
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>прогресс</div>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div style={{ height: 6, background: 'var(--border)', borderRadius: 4 }}>
          <div style={{
            height: '100%', borderRadius: 4,
            background: 'var(--primary)',
            width: `${Math.round(completed.length / total * 100)}%`,
            transition: 'width 0.4s ease',
          }} />
        </div>
      )}

      {/* SOP list */}
      {items.length === 0 ? (
        <div style={{ padding: '40px 0', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Регламентов пока нет</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map((item) => (
            <div
              key={item.sop_id}
              style={{
                padding: '14px 16px', borderRadius: 14,
                border: `1px solid ${item.completed ? '#86efac' : 'var(--border)'}`,
                background: item.completed ? '#f0fdf4' : 'var(--tg-theme-secondary-bg-color, var(--card))',
                display: 'flex', flexDirection: 'column', gap: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{item.completed ? '✅' : '⏳'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                    {item.steps_count} шагов
                    {item.completed && item.completed_at
                      ? ` · ${new Date(item.completed_at).toLocaleDateString('ru', { day: 'numeric', month: 'short' })}`
                      : ''}
                  </div>
                </div>
                {item.completed && item.max_score !== null && item.max_score > 0 && (
                  <div style={{
                    flexShrink: 0, padding: '4px 10px', borderRadius: 20,
                    background: '#dcfce7', color: '#16a34a',
                    fontSize: 12, fontWeight: 700,
                  }}>
                    {item.score}/{item.max_score}
                  </div>
                )}
              </div>

              {/* Certificate link */}
              {item.cert_token && (
                <a
                  href={`https://lms.vyud.online/cert/${item.cert_token}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 12px', borderRadius: 10,
                    background: '#7C3AED', color: 'white',
                    textDecoration: 'none', fontSize: 13, fontWeight: 700,
                    width: 'fit-content',
                  }}
                >
                  🏆 Сертификат
                </a>
              )}

              {/* Not completed — start button */}
              {!item.completed && (
                <button
                  onClick={() => navigate(`/sop/${item.sop_id}`)}
                  style={{
                    padding: '9px 16px', borderRadius: 10,
                    background: 'var(--primary)', color: 'white',
                    border: 'none', cursor: 'pointer',
                    fontSize: 13, fontWeight: 700, width: 'fit-content',
                  }}
                >
                  Пройти →
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyProgressPage;
