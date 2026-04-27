import { useEffect, useState } from 'react';
import type { FC } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import { fetchOrgProgress, nudgeEmployee } from '../api/sop';
import type { OrgProgress } from '../api/sop';
import type { LmsOrg } from '../api/lms';
import { ChevronLeft, Loader2 } from 'lucide-react';

const EmployeeProfilePage: FC = () => {
  const { userKey: empKey } = useParams<{ userKey: string }>();
  const navigate = useNavigate();
  const { user } = useAuthContext();

  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<OrgProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nudging, setNudging] = useState<number | null>(null);

  const userKey = user?.telegram_id ? String(user.telegram_id) : null;

  const org: LmsOrg | null = (() => {
    try {
      const cached = localStorage.getItem('vyud_org');
      return cached ? JSON.parse(cached) : null;
    } catch { return null; }
  })();

  useEffect(() => {
    if (!userKey || !org) { setLoading(false); return; }
    fetchOrgProgress(org.org_id, userKey)
      .then(setProgress)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [userKey]);

  const employee = progress?.members.find((m) => m.user_key === empKey);

  const handleNudge = async (sopId: number) => {
    if (!userKey || !org || !empKey) return;
    setNudging(sopId);
    try {
      await nudgeEmployee(org.org_id, userKey, empKey, sopId);
    } catch { /* ignore */ } finally {
      setNudging(null);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Loader2 size={32} color="var(--primary)" style={{ animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  if (!org?.is_manager) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <p style={{ color: 'var(--error)', fontSize: 14 }}>Только менеджер</p>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <p style={{ color: 'var(--error)', fontSize: 14 }}>{error || 'Сотрудник не найден'}</p>
      </div>
    );
  }

  const completed = employee.sops.filter((s) => s.completed);
  const totalSops = progress?.sops.length ?? 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
          <ChevronLeft size={22} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: 18, margin: 0, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {employee.display_name ?? employee.user_key}
          </h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 12 }}>
            {employee.is_manager ? 'Менеджер' : 'Сотрудник'} · {completed.length}/{totalSops}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      {totalSops > 0 && (
        <div>
          <div style={{ height: 6, background: 'var(--border)', borderRadius: 3 }}>
            <div style={{
              height: '100%', borderRadius: 3, background: 'var(--primary)',
              width: `${Math.round(completed.length / totalSops * 100)}%`,
              transition: 'width 0.4s ease',
            }} />
          </div>
          <p style={{ margin: '6px 0 0', fontSize: 11, color: 'var(--text-secondary)', textAlign: 'right' }}>
            {Math.round(completed.length / totalSops * 100)}% завершено
          </p>
        </div>
      )}

      {/* SOP list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {(progress?.sops ?? []).map((sop) => {
          const entry = employee.sops.find((s) => s.sop_id === sop.id);
          const isCompleted = entry?.completed;
          return (
            <div key={sop.id} style={{
              padding: '12px 14px', borderRadius: 12,
              border: `1px solid ${isCompleted ? '#86efac' : 'var(--border)'}`,
              background: isCompleted ? '#f0fdf4' : 'var(--tg-theme-secondary-bg-color, var(--card))',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ fontSize: 16 }}>{isCompleted ? '✅' : '⏳'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {sop.title}
                </div>
                {isCompleted && entry?.score !== null && entry?.max_score !== null && entry.max_score > 0 && (
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 1 }}>
                    {entry.score}/{entry.max_score}
                    {entry.completed_at ? ` · ${new Date(entry.completed_at).toLocaleDateString('ru', { day: 'numeric', month: 'short' })}` : ''}
                  </div>
                )}
              </div>
              {!isCompleted && !employee.is_manager && (
                <button
                  onClick={() => handleNudge(sop.id)}
                  disabled={nudging === sop.id}
                  style={{
                    flexShrink: 0, padding: '4px 8px', borderRadius: 6,
                    border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 700,
                    background: '#fef9c3', color: '#854d0e',
                  }}
                >
                  {nudging === sop.id ? '...' : '👋 push'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EmployeeProfilePage;
