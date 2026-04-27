import { useEffect, useState } from 'react';
import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import { getUserOrgs } from '../api/lms';
import type { LmsOrg } from '../api/lms';
import { fetchSOPs, fetchMyAssignments, toggleSOPStatus } from '../api/sop';
import type { SOPListItem, MyAssignment } from '../api/sop';
import { Loader2 } from 'lucide-react';

const SOPListPage: FC = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sops, setSops] = useState<SOPListItem[]>([]);
  const [org, setOrg] = useState<LmsOrg | null>(null);
  const [assignments, setAssignments] = useState<MyAssignment[]>([]);
  const [toggling, setToggling] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [sortMode, setSortMode] = useState<'default' | 'pending' | 'alpha'>('default');

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

        const [sopList, myAssignments] = await Promise.all([
          fetchSOPs(currentOrg.org_id, userKey, currentOrg.is_manager),
          fetchMyAssignments(currentOrg.org_id, userKey),
        ]);
        setSops(sopList);
        setAssignments(myAssignments);
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ height: 24, width: '40%', borderRadius: 6, background: 'var(--border)', opacity: 0.4, animation: 'pulse 1.4s ease-in-out infinite' }} />
        <div style={{ height: 14, width: '25%', borderRadius: 4, background: 'var(--border)', opacity: 0.4, marginBottom: 8 }} />
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{
            padding: '14px 16px', borderRadius: 14, border: '1px solid var(--border)',
            background: 'var(--tg-theme-secondary-bg-color, var(--card))',
            display: 'flex', gap: 12, alignItems: 'flex-start',
            opacity: 0.6 - i * 0.1,
            animation: 'pulse 1.4s ease-in-out infinite',
          }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--border)', flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ height: 14, width: '70%', borderRadius: 4, background: 'var(--border)' }} />
              <div style={{ height: 12, width: '90%', borderRadius: 4, background: 'var(--border)' }} />
              <div style={{ height: 10, width: '40%', borderRadius: 4, background: 'var(--border)' }} />
            </div>
          </div>
        ))}
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
      <div style={{ padding: 32, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <span style={{ fontSize: 48 }}>🏢</span>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15, margin: 0, lineHeight: 1.6 }}>
          Вы не состоите в организации.<br />
          Попросите менеджера прислать инвайт или создайте свою.
        </p>
        <button
          onClick={() => navigate('/onboarding')}
          style={{
            padding: '13px 28px', borderRadius: 14, fontWeight: 700, fontSize: 15,
            background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer',
          }}
        >
          Создать организацию →
        </button>
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

      {/* Assigned to employee — prominent section */}
      {!org.is_manager && (() => {
        const urgentAssignments = assignments.filter((a) => !a.completed);
        if (urgentAssignments.length === 0) return null;
        return (
          <div style={{
            padding: '12px 14px', borderRadius: 14,
            background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
            border: '1px solid #93c5fd',
          }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#1d4ed8', marginBottom: 8 }}>
              📌 Назначено вам ({urgentAssignments.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {urgentAssignments.map((a) => {
                const sop = sops.find((s) => s.id === a.sop_id);
                if (!sop) return null;
                const dl = new Date(a.deadline);
                const today = new Date(); today.setHours(0, 0, 0, 0);
                const daysLeft = Math.ceil((dl.getTime() - today.getTime()) / 86400000);
                return (
                  <button
                    key={a.sop_id}
                    onClick={() => navigate(`/sop/${a.sop_id}`)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 10px', borderRadius: 10,
                      background: 'white', border: '1px solid #bfdbfe',
                      cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    <span style={{ fontSize: 16 }}>{a.overdue ? '⚠️' : '📋'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text)' }}>
                        {sop.title}
                      </div>
                      <div style={{ fontSize: 11, color: a.overdue ? '#dc2626' : daysLeft <= 1 ? '#b45309' : '#3b82f6' }}>
                        {a.overdue ? 'Просрочен' : daysLeft === 0 ? 'Сегодня' : daysLeft === 1 ? 'Завтра' : `до ${dl.toLocaleDateString('ru', { day: 'numeric', month: 'short' })}`}
                      </div>
                    </div>
                    <span style={{ fontSize: 14, color: '#3b82f6' }}>→</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Search */}
      <input
        type="text"
        placeholder="Поиск по регламентам..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{
          width: '100%', padding: '10px 14px', borderRadius: 10,
          border: '1px solid var(--border)', background: 'var(--tg-theme-secondary-bg-color, var(--card))',
          color: 'var(--text)', fontSize: 14, outline: 'none', boxSizing: 'border-box',
        }}
      />

      {/* Status tabs — managers only */}
      {org.is_manager && (
        <div style={{ display: 'flex', gap: 6 }}>
          {(['all', 'published', 'draft'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              style={{
                padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                border: 'none', cursor: 'pointer',
                background: statusFilter === f ? 'var(--primary)' : 'var(--tg-theme-secondary-bg-color, var(--card))',
                color: statusFilter === f ? 'white' : 'var(--text-secondary)',
                border: statusFilter === f ? 'none' : '1px solid var(--border)',
              } as React.CSSProperties}
            >
              {f === 'all' ? 'Все' : f === 'published' ? 'Опубликованы' : 'Черновики'}
            </button>
          ))}
        </div>
      )}

      {/* Sort selector — for everyone, but compact */}
      <div style={{ display: 'flex', gap: 6, fontSize: 12 }}>
        {(['default', 'pending', 'alpha'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setSortMode(m)}
            style={{
              padding: '5px 10px', borderRadius: 16, fontSize: 11, fontWeight: 600,
              cursor: 'pointer',
              background: sortMode === m ? 'var(--primary-light)' : 'transparent',
              color: sortMode === m ? 'var(--primary)' : 'var(--text-secondary)',
              border: sortMode === m ? '1px solid var(--primary)' : '1px solid var(--border)',
            }}
          >
            {m === 'default' ? '📌 По умолч.' : m === 'pending' ? '⏳ Непройденные' : '🔤 А-Я'}
          </button>
        ))}
      </div>

      {(() => {
        const q = searchQuery.trim().toLowerCase();
        let filtered = sops
          .filter((s) => statusFilter === 'all' || s.status === statusFilter)
          .filter((s) =>
            !q ||
            s.title.toLowerCase().includes(q) ||
            (s.description?.toLowerCase().includes(q) ?? false),
          );

        if (sortMode === 'pending') {
          filtered = [...filtered].sort((a, b) => {
            if (a.is_completed !== b.is_completed) return a.is_completed ? 1 : -1;
            return 0;
          });
        } else if (sortMode === 'alpha') {
          filtered = [...filtered].sort((a, b) => a.title.localeCompare(b.title, 'ru'));
        }
        return filtered.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 48 }}>📋</span>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15, margin: 0 }}>
              {q || statusFilter !== 'all' ? 'Ничего не найдено' : 'В вашей организации пока нет регламентов'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((sop) => {
          const assignment = assignments.find((a) => a.sop_id === sop.id);
          const isDraft = sop.status === 'draft';
          return (
            <div
              key={sop.id}
              style={{
                width: '100%', textAlign: 'left',
                padding: '14px 16px', borderRadius: 14,
                border: isDraft
                  ? '1px dashed var(--border)'
                  : assignment?.overdue
                  ? '1px solid #fca5a5'
                  : assignment
                  ? '1px solid #fde68a'
                  : '1px solid var(--border)',
                background: isDraft ? 'var(--tg-theme-secondary-bg-color, var(--card))' : 'var(--tg-theme-secondary-bg-color, var(--card))',
                display: 'flex', alignItems: 'flex-start', gap: 12,
                opacity: isDraft ? 0.85 : 1,
              }}
            >
              <button
                onClick={() => !isDraft && navigate(`/sop/${sop.id}`)}
                style={{ display: 'contents', cursor: isDraft ? 'default' : 'pointer' }}
              >
                <span style={{ fontSize: 24, flexShrink: 0, marginTop: 2 }}>
                  {isDraft ? '📝' : sop.is_completed ? '✅' : '📋'}
                </span>
              </button>
              <div
                style={{ flex: 1, minWidth: 0, cursor: isDraft ? 'default' : 'pointer' }}
                onClick={() => !isDraft && navigate(`/sop/${sop.id}`)}
              >
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
                    background: 'var(--primary-light)', color: 'var(--primary)',
                  }}>
                    📖 {sop.steps_count} {sop.steps_count === 1 ? 'шаг' : sop.steps_count < 5 ? 'шага' : 'шагов'}
                  </span>
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
                  {assignment && !sop.is_completed && (
                    <span style={{
                      fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 600,
                      background: assignment.overdue ? '#fee2e2' : assignment.days_left <= 1 ? '#fef9c3' : '#eff6ff',
                      color: assignment.overdue ? '#dc2626' : assignment.days_left <= 1 ? '#854d0e' : '#1d4ed8',
                    }}>
                      {assignment.overdue
                        ? '⚠️ Просрочен'
                        : assignment.days_left === 0
                        ? '⏰ Сегодня'
                        : assignment.days_left === 1
                        ? '⏰ Завтра'
                        : `до ${new Date(assignment.deadline).toLocaleDateString('ru', { day: 'numeric', month: 'short' })}`}
                    </span>
                  )}
                </div>
              </div>

              {/* Manager: publish/unpublish toggle */}
              {org?.is_manager && (
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (!userKey || toggling === sop.id) return;
                    setToggling(sop.id);
                    const newStatus = isDraft ? 'published' : 'draft';
                    try {
                      await toggleSOPStatus(sop.id, userKey, newStatus);
                      setSops((prev) => prev.map((s) => s.id === sop.id ? { ...s, status: newStatus } : s));
                    } catch { /* ignore */ } finally {
                      setToggling(null);
                    }
                  }}
                  style={{
                    flexShrink: 0, alignSelf: 'center',
                    padding: '6px 10px', borderRadius: 8,
                    border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700,
                    background: isDraft ? '#dcfce7' : '#fef9c3',
                    color: isDraft ? '#16a34a' : '#854d0e',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}
                >
                  {toggling === sop.id
                    ? <Loader2 size={11} style={{ animation: 'spin 0.8s linear infinite' }} />
                    : isDraft ? '▶ Опубликовать' : '⏸ В черновик'}
                </button>
              )}
            </div>
          );
        })}
          </div>
        );
      })()}
    </div>
  );
};

export default SOPListPage;
