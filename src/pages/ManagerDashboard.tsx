import { useEffect, useMemo, useState } from 'react';
import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import { getUserOrgs } from '../api/lms';
import type { LmsOrg } from '../api/lms';
import { fetchOrgProgress, createAssignment, nudgeEmployee } from '../api/sop';
import type { OrgProgress } from '../api/sop';
import { Loader2, Copy, CheckCheck, Pencil, Download } from 'lucide-react';

const ManagerDashboard: FC = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [org, setOrg] = useState<LmsOrg | null>(null);
  const [progress, setProgress] = useState<OrgProgress | null>(null);
  const [copied, setCopied] = useState(false);
  const [nudging, setNudging] = useState<string | null>(null); // `${empKey}_${sopId}`

  // Assign modal state
  const [assignModal, setAssignModal] = useState<{ sopId: number; sopTitle: string } | null>(null);
  const [assignUserKey, setAssignUserKey] = useState('');
  const [assignDeadline, setAssignDeadline] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState('');

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
        if (!currentOrg || !currentOrg.is_manager) { setLoading(false); return; }

        const data = await fetchOrgProgress(currentOrg.org_id, userKey);
        setProgress(data);
      } catch (e: any) {
        setError(e.message || 'Ошибка загрузки');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [userKey]);

  const employees = useMemo(
    () => (progress?.members ?? []).filter((m) => !m.is_manager),
    [progress],
  );

  const sops = progress?.sops ?? [];

  const completedAllCount = useMemo(
    () =>
      employees.filter((emp) =>
        sops.every((sop) => emp.sops.find((s) => s.sop_id === sop.id)?.completed)
      ).length,
    [employees, sops],
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

  const handleAssignSubmit = async () => {
    if (!assignUserKey || !assignDeadline || !org || !assignModal || !userKey) return;
    setAssignLoading(true);
    setAssignError('');
    try {
      await createAssignment(org.org_id, userKey, assignModal.sopId, assignUserKey, assignDeadline);
      setAssignModal(null);
      setAssignUserKey('');
      setAssignDeadline('');
    } catch (e: any) {
      setAssignError(e.message || 'Ошибка');
    } finally {
      setAssignLoading(false);
    }
  };

  const BOT_USERNAME = 'VyudAiBot';
  const inviteLink = org ? `https://t.me/${BOT_USERNAME}?startapp=invite_${org.invite_code}` : '';

  const handleCopyInvite = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available — show link as fallback
    }
  };

  // ── Dashboard ────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, margin: '0 0 4px', fontWeight: 700 }}>Дашборд</h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 13 }}>{org.org_name}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => navigate('/upload-sop')}
            style={{
              flexShrink: 0, padding: '8px 12px', borderRadius: 10,
              fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer',
              background: 'var(--primary)', color: 'white',
              display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            📄 PDF
          </button>
          {org && userKey && (
            <a
              href={`${import.meta.env.VITE_LMS_URL || 'http://38.180.229.254:8000'}/api/orgs/${org.org_id}/sop-progress/export-csv?user_key=${userKey}`}
              download
              style={{
                flexShrink: 0, padding: '8px 10px', borderRadius: 10,
                fontWeight: 700, fontSize: 13, border: '1px solid var(--border)', cursor: 'pointer',
                background: 'var(--tg-theme-secondary-bg-color, var(--card))', color: 'var(--text)',
                display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none',
              }}
            >
              <Download size={14} />
            </a>
          )}
        </div>
      </div>

      {/* Invite card */}
      <div style={{
        borderRadius: 14, padding: '14px 16px',
        background: 'var(--card)', border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>Пригласить сотрудника</div>
          <div style={{
            fontSize: 12, color: 'var(--text-secondary)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {inviteLink}
          </div>
        </div>
        <button
          onClick={handleCopyInvite}
          style={{
            flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: copied ? '#16a34a' : 'var(--primary)',
            color: 'white', fontSize: 13, fontWeight: 600, transition: 'background 0.2s',
          }}
        >
          {copied ? <CheckCheck size={15} /> : <Copy size={15} />}
          {copied ? 'Скопировано' : 'Копировать'}
        </button>
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
            {completedAllCount} из {employees.length}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
            сотрудников прошли все регламенты
          </div>
        </div>
      </div>

      {/* Matrix */}
      {sops.length === 0 || employees.length === 0 ? (
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
                    <div>{sop.title.length > 20 ? `${sop.title.slice(0, 20)}…` : sop.title}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 3 }}>
                      {sop.completed_count}/{sop.employee_count}
                      {sop.avg_score_pct !== null ? ` · ${sop.avg_score_pct}%` : ''}
                      {sop.avg_time_sec ? ` · ${Math.round(sop.avg_time_sec / 60)}м` : ''}
                    </div>
                    <div style={{ display: 'flex', gap: 4, marginTop: 4, justifyContent: 'center' }}>
                      <button
                        onClick={() => { setAssignModal({ sopId: sop.id, sopTitle: sop.title }); setAssignError(''); }}
                        style={{
                          fontSize: 10, padding: '2px 8px', borderRadius: 6,
                          border: 'none', cursor: 'pointer', fontWeight: 600,
                          background: 'var(--primary-light)', color: 'var(--primary)',
                        }}
                      >
                        + Назначить
                      </button>
                      <button
                        onClick={() => navigate(`/sop/${sop.id}/edit`)}
                        style={{
                          fontSize: 10, padding: '2px 6px', borderRadius: 6,
                          border: 'none', cursor: 'pointer',
                          background: 'var(--tg-theme-secondary-bg-color, #f3f4f6)', color: 'var(--text-secondary)',
                          display: 'flex', alignItems: 'center',
                        }}
                      >
                        <Pencil size={10} />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employees.map((emp, rowIdx) => (
                <tr
                  key={emp.user_key}
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
                    {emp.display_name ?? emp.user_key}
                  </td>
                  {sops.map((sop) => {
                    const entry = emp.sops.find((s) => s.sop_id === sop.id);
                    return (
                      <td key={sop.id} style={{
                        padding: '10px 12px', textAlign: 'center',
                        borderBottom: '1px solid var(--border)',
                      }}>
                        {entry?.completed ? (
                          <span style={{ color: '#16a34a', fontWeight: 700, fontSize: 13 }}>
                            ✅ {entry.score}/{entry.max_score}
                          </span>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                            <span style={{ color: 'var(--text-secondary)', fontSize: 16 }}>⏳</span>
                            {org && userKey && (
                              <button
                                onClick={async () => {
                                  const key = `${emp.user_key}_${sop.id}`;
                                  setNudging(key);
                                  try {
                                    await nudgeEmployee(org.org_id, userKey, emp.user_key, sop.id);
                                  } catch { /* ignore */ } finally {
                                    setNudging(null);
                                  }
                                }}
                                disabled={nudging === `${emp.user_key}_${sop.id}`}
                                style={{
                                  fontSize: 9, padding: '2px 6px', borderRadius: 6,
                                  border: 'none', cursor: 'pointer', fontWeight: 600,
                                  background: '#fef9c3', color: '#854d0e',
                                  opacity: nudging === `${emp.user_key}_${sop.id}` ? 0.5 : 1,
                                }}
                              >
                                {nudging === `${emp.user_key}_${sop.id}` ? '...' : '👋 push'}
                              </button>
                            )}
                          </div>
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
      {/* Assign modal */}
      {assignModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          zIndex: 1000, padding: '0 0 0 0',
        }} onClick={(e) => { if (e.target === e.currentTarget) setAssignModal(null); }}>
          <div style={{
            background: 'var(--bg)', borderRadius: '20px 20px 0 0',
            padding: '24px 20px 32px', width: '100%', maxWidth: 500,
            display: 'flex', flexDirection: 'column', gap: 14,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Назначить регламент</h3>
              <button onClick={() => setAssignModal(null)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: 'var(--text-secondary)' }}>×</button>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
              📋 <b>{assignModal.sopTitle}</b>
            </p>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                Сотрудник
              </label>
              <select
                value={assignUserKey}
                onChange={(e) => setAssignUserKey(e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 10,
                  border: '1px solid var(--border)', background: 'var(--card)',
                  color: 'var(--text)', fontSize: 14, boxSizing: 'border-box',
                }}
              >
                <option value="">Выберите сотрудника</option>
                {employees.map((emp) => (
                  <option key={emp.user_key} value={emp.user_key}>
                    {emp.display_name ?? emp.user_key}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                Дедлайн
              </label>
              <input
                type="date"
                value={assignDeadline}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setAssignDeadline(e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 10,
                  border: '1px solid var(--border)', background: 'var(--card)',
                  color: 'var(--text)', fontSize: 14, boxSizing: 'border-box',
                }}
              />
            </div>

            {assignError && (
              <p style={{ margin: 0, fontSize: 12, color: 'var(--error)' }}>{assignError}</p>
            )}

            <button
              onClick={handleAssignSubmit}
              disabled={assignLoading || !assignUserKey || !assignDeadline}
              style={{
                padding: '13px', borderRadius: 12, fontWeight: 700, fontSize: 15,
                background: 'var(--primary)', color: 'white', border: 'none',
                cursor: assignLoading || !assignUserKey || !assignDeadline ? 'default' : 'pointer',
                opacity: assignLoading || !assignUserKey || !assignDeadline ? 0.6 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {assignLoading
                ? <><Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Назначаем...</>
                : '📤 Назначить'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerDashboard;
