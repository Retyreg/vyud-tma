import { useEffect, useState } from 'react';
import type { FC } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { fetchOrgMembers, removeOrgMember } from '../api/lms';
import type { OrgMemberItem } from '../api/lms';
import type { LmsOrg } from '../api/lms';
import { Loader2, Trash2 } from 'lucide-react';

const MembersPage: FC = () => {
  const { user } = useAuthContext();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [members, setMembers] = useState<OrgMemberItem[]>([]);
  const [removing, setRemoving] = useState<string | null>(null);
  const [confirmKey, setConfirmKey] = useState<string | null>(null);

  const userKey = user?.telegram_id ? String(user.telegram_id) : null;

  const org: LmsOrg | null = (() => {
    try {
      const cached = localStorage.getItem('vyud_org');
      return cached ? JSON.parse(cached) : null;
    } catch { return null; }
  })();

  useEffect(() => {
    if (!userKey || !org) { setLoading(false); return; }
    fetchOrgMembers(org.org_id, userKey)
      .then(setMembers)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [userKey]);

  const handleRemove = async (memberKey: string) => {
    if (!userKey || !org) return;
    setRemoving(memberKey);
    try {
      await removeOrgMember(org.org_id, userKey, memberKey);
      setMembers((prev) => prev.filter((m) => m.user_key !== memberKey));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setRemoving(null);
      setConfirmKey(null);
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
        <p style={{ color: 'var(--error)', fontSize: 14 }}>Только менеджер может просматривать участников</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h1 style={{ fontSize: 20, margin: '0 0 4px', fontWeight: 700 }}>Участники</h1>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 13 }}>{org.org_name} · {members.length} чел.</p>
      </div>

      {error && (
        <p style={{ color: 'var(--error)', fontSize: 13, margin: 0 }}>{error}</p>
      )}

      {members.length === 0 ? (
        <div style={{ padding: '40px 0', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Нет участников</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {members.map((m) => (
            <div
              key={m.user_key}
              style={{
                padding: '12px 16px', borderRadius: 14,
                border: '1px solid var(--border)',
                background: 'var(--tg-theme-secondary-bg-color, var(--card))',
                display: 'flex', alignItems: 'center', gap: 12,
              }}
            >
              <span style={{ fontSize: 24 }}>{m.is_manager ? '👑' : '👤'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {m.display_name ?? m.user_key}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                  {m.is_manager ? 'Менеджер' : 'Сотрудник'}
                  {m.joined_at ? ` · с ${new Date(m.joined_at).toLocaleDateString('ru', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
                </div>
              </div>

              {/* Remove button — not for self or other managers */}
              {!m.is_manager && m.user_key !== userKey && (
                confirmKey === m.user_key ? (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => handleRemove(m.user_key)}
                      disabled={removing === m.user_key}
                      style={{
                        padding: '6px 10px', borderRadius: 8, border: 'none',
                        background: '#fee2e2', color: '#dc2626', fontWeight: 700, fontSize: 12,
                        cursor: 'pointer',
                      }}
                    >
                      {removing === m.user_key
                        ? <Loader2 size={11} style={{ animation: 'spin 0.8s linear infinite' }} />
                        : 'Удалить'}
                    </button>
                    <button
                      onClick={() => setConfirmKey(null)}
                      style={{
                        padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)',
                        background: 'none', color: 'var(--text-secondary)', fontSize: 12,
                        cursor: 'pointer',
                      }}
                    >
                      Отмена
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmKey(m.user_key)}
                    style={{
                      padding: '8px', borderRadius: 8, border: 'none',
                      background: 'none', color: 'var(--text-secondary)', cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                )
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MembersPage;
