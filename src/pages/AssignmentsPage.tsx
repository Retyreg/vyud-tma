import { useEffect, useState } from 'react';
import type { FC } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { fetchAssignments, deleteAssignment } from '../api/sop';
import type { AssignmentItem } from '../api/sop';
import type { LmsOrg } from '../api/lms';
import { Loader2, Trash2 } from 'lucide-react';

const AssignmentsPage: FC = () => {
  const { user } = useAuthContext();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const userKey = user?.telegram_id ? String(user.telegram_id) : null;

  const org: LmsOrg | null = (() => {
    try {
      const cached = localStorage.getItem('vyud_org');
      return cached ? JSON.parse(cached) : null;
    } catch { return null; }
  })();

  useEffect(() => {
    if (!userKey || !org) { setLoading(false); return; }
    fetchAssignments(org.org_id, userKey)
      .then(setAssignments)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [userKey]);

  const handleDelete = async (id: number) => {
    if (!userKey || !org) return;
    setDeleting(id);
    try {
      await deleteAssignment(org.org_id, id, userKey);
      setAssignments((prev) => prev.filter((a) => a.id !== id));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setDeleting(null);
      setConfirmId(null);
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
        <p style={{ color: 'var(--error)', fontSize: 14 }}>Только менеджер может просматривать назначения</p>
      </div>
    );
  }

  const pending = assignments.filter((a) => !a.completed);
  const done = assignments.filter((a) => a.completed);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h1 style={{ fontSize: 20, margin: '0 0 4px', fontWeight: 700 }}>Назначения</h1>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 13 }}>
          {pending.length} активных · {done.length} выполнено
        </p>
      </div>

      {error && <p style={{ color: 'var(--error)', fontSize: 13, margin: 0 }}>{error}</p>}

      {assignments.length === 0 ? (
        <div style={{ padding: '40px 0', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Назначений пока нет</p>
        </div>
      ) : (
        <>
          {pending.length > 0 && (
            <div>
              <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Активные
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {pending.map((a) => <AssignmentCard key={a.id} assignment={a} userKey={userKey!} confirmId={confirmId} deleting={deleting} onConfirm={setConfirmId} onDelete={handleDelete} onCancelConfirm={() => setConfirmId(null)} />)}
              </div>
            </div>
          )}

          {done.length > 0 && (
            <div>
              <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Выполнено
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {done.map((a) => <AssignmentCard key={a.id} assignment={a} userKey={userKey!} confirmId={confirmId} deleting={deleting} onConfirm={setConfirmId} onDelete={handleDelete} onCancelConfirm={() => setConfirmId(null)} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

interface CardProps {
  assignment: AssignmentItem;
  userKey: string;
  confirmId: number | null;
  deleting: number | null;
  onConfirm: (id: number) => void;
  onDelete: (id: number) => void;
  onCancelConfirm: () => void;
}

const AssignmentCard: FC<CardProps> = ({ assignment: a, confirmId, deleting, onConfirm, onDelete, onCancelConfirm }) => {
  const deadlineDate = new Date(a.deadline);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const daysLeft = Math.ceil((deadlineDate.getTime() - today.getTime()) / 86400000);

  return (
    <div style={{
      padding: '12px 14px', borderRadius: 14,
      border: `1px solid ${a.overdue ? '#fca5a5' : a.completed ? '#86efac' : 'var(--border)'}`,
      background: a.completed ? '#f0fdf4' : a.overdue ? '#fff7f7' : 'var(--tg-theme-secondary-bg-color, var(--card))',
      display: 'flex', alignItems: 'flex-start', gap: 10,
    }}>
      <span style={{ fontSize: 18, flexShrink: 0, marginTop: 2 }}>{a.completed ? '✅' : a.overdue ? '⚠️' : '⏳'}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {a.sop_title}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
          {a.display_name ?? a.user_key} · до {deadlineDate.toLocaleDateString('ru', { day: 'numeric', month: 'short' })}
          {!a.completed && !a.overdue && daysLeft >= 0 && (
            <span style={{ marginLeft: 6, color: daysLeft <= 1 ? '#854d0e' : 'var(--text-secondary)' }}>
              ({daysLeft === 0 ? 'сегодня' : `${daysLeft}д`})
            </span>
          )}
        </div>
      </div>

      {confirmId === a.id ? (
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button
            onClick={() => onDelete(a.id)}
            disabled={deleting === a.id}
            style={{ padding: '5px 8px', borderRadius: 7, border: 'none', background: '#fee2e2', color: '#dc2626', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}
          >
            {deleting === a.id ? '...' : 'Удалить'}
          </button>
          <button
            onClick={onCancelConfirm}
            style={{ padding: '5px 8px', borderRadius: 7, border: '1px solid var(--border)', background: 'none', color: 'var(--text-secondary)', fontSize: 11, cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          onClick={() => onConfirm(a.id)}
          style={{ padding: '6px', borderRadius: 8, border: 'none', background: 'none', color: 'var(--text-secondary)', cursor: 'pointer', flexShrink: 0 }}
        >
          <Trash2 size={15} />
        </button>
      )}
    </div>
  );
};

export default AssignmentsPage;
