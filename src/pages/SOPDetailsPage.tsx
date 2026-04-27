import { useEffect, useState } from 'react';
import type { FC } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import { fetchSOPCompletions } from '../api/sop';
import type { SOPCompletionDetail } from '../api/sop';
import type { LmsOrg } from '../api/lms';
import { Loader2, ChevronLeft } from 'lucide-react';

const SOPDetailsPage: FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthContext();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sopTitle, setSopTitle] = useState('');
  const [completions, setCompletions] = useState<SOPCompletionDetail[]>([]);

  const userKey = user?.telegram_id ? String(user.telegram_id) : null;

  const org: LmsOrg | null = (() => {
    try {
      const cached = localStorage.getItem('vyud_org');
      return cached ? JSON.parse(cached) : null;
    } catch { return null; }
  })();

  useEffect(() => {
    if (!userKey || !org || !id) { setLoading(false); return; }
    fetchSOPCompletions(org.org_id, Number(id), userKey)
      .then((d) => { setSopTitle(d.sop_title); setCompletions(d.completions); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [userKey, id]);

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

  if (error) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <p style={{ color: 'var(--error)', fontSize: 14 }}>{error}</p>
      </div>
    );
  }

  const done = completions.filter((c) => c.completed);
  const pending = completions.filter((c) => !c.completed);
  const avgPct = done.length > 0
    ? Math.round(done.reduce((sum, c) => sum + (c.score_pct ?? 0), 0) / done.length)
    : null;

  const fmtTime = (secs: number | null) => {
    if (!secs) return '—';
    const m = Math.floor(secs / 60);
    return m > 0 ? `${m}м` : `${secs}с`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
          <ChevronLeft size={22} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: 18, margin: 0, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sopTitle}</h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 12 }}>Детали прохождения</p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {[
          { label: 'Прошли', value: `${done.length}/${completions.length}`, icon: '✅' },
          { label: 'Средний', value: avgPct !== null ? `${avgPct}%` : '—', icon: '📊' },
          { label: 'Не начали', value: pending.length, icon: '⏳' },
        ].map((s) => (
          <div key={s.label} style={{
            padding: '10px 8px', borderRadius: 12, textAlign: 'center',
            background: 'var(--tg-theme-secondary-bg-color, var(--card))',
            border: '1px solid var(--border)',
          }}>
            <div style={{ fontSize: 18 }}>{s.icon}</div>
            <div style={{ fontWeight: 800, fontSize: 16, margin: '2px 0' }}>{s.value}</div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Completions list */}
      {done.length > 0 && (
        <div>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Прошли ({done.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {done.map((c) => (
              <div key={c.user_key} style={{
                padding: '10px 14px', borderRadius: 12,
                border: '1px solid #86efac', background: '#f0fdf4',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{ fontSize: 16 }}>✅</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.display_name ?? c.user_key}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 1 }}>
                    {c.completed_at ? new Date(c.completed_at).toLocaleDateString('ru', { day: 'numeric', month: 'short' }) : ''}
                    {c.time_spent_sec ? ` · ${fmtTime(c.time_spent_sec)}` : ''}
                  </div>
                </div>
                {c.score_pct !== null && (
                  <div style={{
                    flexShrink: 0, padding: '3px 9px', borderRadius: 18,
                    fontSize: 12, fontWeight: 700,
                    background: c.score_pct >= 80 ? '#dcfce7' : c.score_pct >= 50 ? '#fef9c3' : '#fee2e2',
                    color: c.score_pct >= 80 ? '#16a34a' : c.score_pct >= 50 ? '#854d0e' : '#dc2626',
                  }}>
                    {c.score_pct}%
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {pending.length > 0 && (
        <div>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Не прошли ({pending.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {pending.map((c) => (
              <div key={c.user_key} style={{
                padding: '10px 14px', borderRadius: 12,
                border: '1px solid var(--border)', background: 'var(--tg-theme-secondary-bg-color, var(--card))',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{ fontSize: 16 }}>⏳</span>
                <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.display_name ?? c.user_key}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SOPDetailsPage;
