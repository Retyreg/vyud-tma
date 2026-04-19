import { useEffect, useState } from 'react';
import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import { getUserOrgs } from '../api/lms';
import type { LmsOrg } from '../api/lms';
import { fetchSOPs } from '../api/sop';
import type { SOPListItem } from '../api/sop';
import { Loader2 } from 'lucide-react';

const SOPListPage: FC = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sops, setSops] = useState<SOPListItem[]>([]);
  const [org, setOrg] = useState<LmsOrg | null>(null);

  const userKey = user?.telegram_id ? String(user.telegram_id) : null;

  useEffect(() => {
    if (!userKey) return;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        // Resolve org — prefer localStorage cache to avoid extra round-trip
        let currentOrg: LmsOrg | null = null;
        try {
          const cached = localStorage.getItem('vyud_org');
          if (cached) currentOrg = JSON.parse(cached);
        } catch { /* ignore parse error */ }

        if (!currentOrg) {
          const orgs = await getUserOrgs(userKey);
          currentOrg = orgs[0] ?? null;
          if (currentOrg) {
            localStorage.setItem('vyud_org', JSON.stringify(currentOrg));
          }
        }

        setOrg(currentOrg);
        if (!currentOrg) { setLoading(false); return; }

        // fetchSOPs already returns is_completed per SOP for this userKey
        const sopList = await fetchSOPs(currentOrg.org_id, userKey);
        setSops(sopList);
      } catch (e: any) {
        setError(e.message || 'Ошибка загрузки');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [userKey]);

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '60vh', flexDirection: 'column', gap: 12,
      }}>
        <Loader2 size={32} color="var(--primary)" style={{ animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>Загрузка регламентов...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <p style={{ color: 'var(--error)', fontSize: 14 }}>{error}</p>
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: 12, padding: '10px 24px', borderRadius: 10,
            background: 'var(--primary)', color: 'white', border: 'none',
            cursor: 'pointer', fontWeight: 600, fontSize: 14,
          }}
        >
          Повторить
        </button>
      </div>
    );
  }

  if (!org) {
    return (
      <div style={{ padding: 32, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 48 }}>🏢</span>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15, margin: 0, lineHeight: 1.5 }}>
          Вы не состоите в организации.<br />
          Попросите менеджера прислать инвайт.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div>
          <h1 style={{ fontSize: 20, margin: '0 0 4px', fontWeight: 700, color: 'var(--text)' }}>
            Регламенты
          </h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 13 }}>{org.org_name}</p>
        </div>
        {org.is_manager && (
          <button
            onClick={() => navigate('/templates')}
            style={{
              flexShrink: 0, padding: '8px 14px', borderRadius: 10,
              background: 'var(--primary-light)', border: '1px solid var(--border)',
              color: 'var(--primary)', fontWeight: 700, fontSize: 13,
              cursor: 'pointer', minHeight: 36,
            }}
          >
            📚 Шаблоны
          </button>
        )}
      </div>

      {sops.length === 0 ? (
        <div style={{ padding: '40px 0', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 48 }}>📋</span>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, margin: 0 }}>
            В вашей организации пока нет регламентов
          </p>
        </div>
      ) : (
        sops.map((sop) => (
          <button
            key={sop.id}
            onClick={() => navigate(`/sop/${sop.id}`)}
            style={{
              width: '100%', textAlign: 'left',
              padding: '14px 16px', borderRadius: 14,
              border: '1px solid var(--border)',
              background: 'var(--tg-theme-secondary-bg-color, var(--card))',
              cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 12,
              minHeight: 44,
            }}
          >
            <span style={{ fontSize: 24, flexShrink: 0, marginTop: 2 }}>
              {sop.is_completed ? '✅' : '📋'}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontWeight: 700, fontSize: 15, color: 'var(--text)',
                marginBottom: 4, lineHeight: 1.3,
              }}>
                {sop.title}
              </div>
              {sop.description && (
                <div style={{
                  fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8,
                  overflow: 'hidden', textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}>
                  {sop.description}
                </div>
              )}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 600,
                  background: sop.status === 'published' ? '#dcfce7' : '#fef9c3',
                  color: sop.status === 'published' ? '#16a34a' : '#854d0e',
                }}>
                  {sop.status === 'published' ? 'Опубликован' : 'Черновик'}
                </span>
                {sop.is_completed && (
                  <span style={{
                    fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 600,
                    background: '#dcfce7', color: '#16a34a',
                  }}>
                    Пройден
                  </span>
                )}
              </div>
            </div>
          </button>
        ))
      )}
    </div>
  );
};

export default SOPListPage;
