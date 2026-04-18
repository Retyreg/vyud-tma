import { useEffect, useMemo, useState } from 'react';
import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import { getUserOrgs } from '../api/lms';
import type { LmsOrg } from '../api/lms';
import { fetchSOPs, fetchSOPProgress } from '../api/sop';
import type { SOP, SOPCompletion } from '../api/sop';
import { Loader2 } from 'lucide-react';

const ManagerDashboard: FC = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [org, setOrg] = useState<LmsOrg | null>(null);
  const [sops, setSops] = useState<SOP[]>([]);
  const [progressMap, setProgressMap] = useState<Record<number, SOPCompletion[]>>({});

  const userKey = user?.telegram_id ? String(user.telegram_id) : null;

  useEffect(() => {
    if (!userKey) return;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        // Resolve org
        let currentOrg: LmsOrg | null = null;
        try {
          const cached = localStorage.getItem('vyud_org');
          if (cached) currentOrg = JSON.parse(cached);
        } catch { /* ignore */ }

        if (!currentOrg) {
          const orgs = await getUserOrgs(userKey);
          currentOrg = orgs[0] ?? null;
          if (currentOrg) localStorage.setItem('vyud_org', JSON.stringify(currentOrg));
        }

        setOrg(currentOrg);
        if (!currentOrg) { setLoading(false); return; }

        // Access check
        if (!currentOrg.is_manager) { setLoading(false); return; }

        // Fetch SOPs and all progress in parallel
        const sopList = await fetchSOPs(currentOrg.org_id);
        setSops(sopList);

        const results = await Promise.allSettled(
          sopList.map((sop) => fetchSOPProgress(sop.id))
        );

        const map: Record<number, SOPCompletion[]> = {};
        results.forEach((result, idx) => {
          map[sopList[idx].id] = result.status === 'fulfilled' ? result.value : [];
        });
        setProgressMap(map);
      } catch (e: any) {
        setError(e.message || 'Ошибка загрузки');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [userKey]);

  // Unique employees across all completions
  const allUserKeys = useMemo(() => {
    const keys = new Set<string>();
    Object.values(progressMap).forEach((completions) =>
      completions.forEach((c) => keys.add(c.user_key))
    );
    return Array.from(keys).sort();
  }, [progressMap]);

  // Count employees who completed ALL sops
  const completedAllCount = useMemo(
    () =>
      allUserKeys.filter((key) =>
        sops.every((sop) => (progressMap[sop.id] ?? []).some((c) => c.user_key === key))
      ).length,
    [allUserKeys, sops, progressMap]
  );

  // ── States ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '60vh', flexDirection: 'column', gap: 12,
      }}>
        <Loader2 size={32} color="var(--primary)" style={{ animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>Загрузка дашборда...</p>
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

  if (!org.is_manager) {
    return (
      <div style={{ padding: 32, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 48 }}>🔒</span>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15, margin: 0 }}>
          Дашборд доступен только менеджерам.
        </p>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '10px 24px', borderRadius: 10, background: 'var(--primary)',
            color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14,
          }}
        >
          К регламентам
        </button>
      </div>
    );
  }

  // ── Dashboard ────────────────────────────────────────────────────────────

  const totalEmployees = allUserKeys.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Title */}
      <div>
        <h1 style={{ fontSize: 20, margin: '0 0 4px', fontWeight: 700 }}>Дашборд</h1>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 13 }}>{org.org_name}</p>
      </div>

      {/* Summary card */}
      <div style={{
        borderRadius: 14, padding: '16px 20px',
        background: 'var(--primary-light)', border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <span style={{ fontSize: 36 }}>📊</span>
        <div>
          <div style={{ fontWeight: 800, fontSize: 22, color: 'var(--primary)' }}>
            {completedAllCount} из {totalEmployees}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
            сотрудников прошли все регламенты
          </div>
        </div>
      </div>

      {/* Matrix */}
      {sops.length === 0 || totalEmployees === 0 ? (
        <div style={{ padding: '32px 0', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
            {sops.length === 0
              ? 'Нет регламентов для отображения'
              : 'Никто ещё не проходил регламенты'}
          </p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid var(--border)' }}>
          <table style={{
            borderCollapse: 'collapse', fontSize: 13,
            minWidth: sops.length > 2 ? `${sops.length * 100 + 140}px` : '100%',
          }}>
            <thead>
              <tr style={{ background: 'var(--tg-theme-secondary-bg-color, var(--card))' }}>
                <th style={{
                  padding: '10px 14px', textAlign: 'left', fontWeight: 700,
                  borderBottom: '1px solid var(--border)',
                  position: 'sticky', left: 0,
                  background: 'var(--tg-theme-secondary-bg-color, var(--card))',
                  minWidth: 120,
                }}>
                  Сотрудник
                </th>
                {sops.map((sop) => (
                  <th key={sop.id} style={{
                    padding: '10px 12px', textAlign: 'center', fontWeight: 600,
                    borderBottom: '1px solid var(--border)',
                    maxWidth: 100, minWidth: 90,
                    wordBreak: 'break-word',
                  }}>
                    {sop.title.length > 20 ? `${sop.title.slice(0, 20)}…` : sop.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allUserKeys.map((key, rowIdx) => (
                <tr
                  key={key}
                  style={{
                    background: rowIdx % 2 === 0
                      ? 'var(--tg-theme-bg-color, var(--bg))'
                      : 'var(--tg-theme-secondary-bg-color, var(--card))',
                  }}
                >
                  <td style={{
                    padding: '10px 14px', fontWeight: 600, color: 'var(--text)',
                    borderBottom: '1px solid var(--border)',
                    position: 'sticky', left: 0,
                    background: rowIdx % 2 === 0
                      ? 'var(--tg-theme-bg-color, var(--bg))'
                      : 'var(--tg-theme-secondary-bg-color, var(--card))',
                    maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {key}
                  </td>
                  {sops.map((sop) => {
                    const completion = (progressMap[sop.id] ?? []).find((c) => c.user_key === key);
                    return (
                      <td key={sop.id} style={{
                        padding: '10px 12px', textAlign: 'center',
                        borderBottom: '1px solid var(--border)',
                      }}>
                        {completion ? (
                          <span style={{ color: '#16a34a', fontWeight: 700, fontSize: 13 }}>
                            ✅ {completion.score}/{completion.max_score}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-secondary)', fontSize: 16 }}>⏳</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ManagerDashboard;
