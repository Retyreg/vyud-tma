import { useEffect, useState } from 'react';
import type { FC } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import { fetchSOP, updateSOP, deleteSOP, duplicateSOP } from '../api/sop';
import type { SOPStep } from '../api/sop';
import { ChevronLeft, Loader2, Trash2, Copy, ChevronUp, ChevronDown } from 'lucide-react';

const SOPEditPage: FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthContext();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [title, setTitle] = useState('');
  const [steps, setSteps] = useState<SOPStep[]>([]);

  const userKey = user?.telegram_id ? String(user.telegram_id) : '';

  useEffect(() => {
    if (!id) return;
    fetchSOP(Number(id))
      .then((data) => {
        setTitle(data.title);
        setSteps([...data.steps].sort((a, b) => a.step_number - b.step_number));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    if (!id || !userKey) return;
    setSaving(true);
    setError(null);
    try {
      await updateSOP(Number(id), userKey, { title, steps });
      navigate(-1);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicate = async () => {
    if (!id || !userKey) return;
    setDuplicating(true);
    try {
      const r = await duplicateSOP(Number(id), userKey);
      navigate(`/sop/${r.sop_id}/edit`, { replace: true });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setDuplicating(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !userKey) return;
    setDeleting(true);
    try {
      await deleteSOP(Number(id), userKey);
      navigate('/', { replace: true });
    } catch (e: any) {
      setError(e.message);
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: 12 }}>
        <Loader2 size={32} color="var(--primary)" style={{ animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--tg-theme-bg-color, var(--bg))', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12,
        borderBottom: '1px solid var(--border)',
        background: 'var(--tg-theme-bg-color, var(--card))',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', minWidth: 44, minHeight: 44, alignItems: 'center' }}
        >
          <ChevronLeft size={22} />
        </button>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>Редактировать СОП</p>
        </div>
        <button
          onClick={handleDuplicate}
          disabled={duplicating}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}
        >
          {duplicating ? <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Copy size={18} />}
        </button>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, display: 'flex', alignItems: 'center', color: '#dc2626' }}
        >
          <Trash2 size={20} />
        </button>
      </div>

      {/* Form */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {error && (
          <div style={{ padding: '10px 14px', borderRadius: 10, background: '#fee2e2', color: '#dc2626', fontSize: 14 }}>
            {error}
          </div>
        )}

        {/* Title */}
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Название регламента
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              width: '100%', padding: '12px 14px', borderRadius: 12,
              border: '1px solid var(--border)', background: 'var(--tg-theme-secondary-bg-color, var(--card))',
              color: 'var(--text)', fontSize: 15, fontWeight: 600, boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Шаги ({steps.length})
          </div>
          {steps.length === 0 && (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13, border: '1px dashed var(--border)', borderRadius: 12 }}>
              Нет шагов. Добавьте первый →
            </div>
          )}
          {steps.map((step, idx) => (
            <div key={step.step_number} style={{
              borderRadius: 14, border: '1px solid var(--border)',
              background: 'var(--tg-theme-secondary-bg-color, var(--card))',
              padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)' }}>
                  Шаг {idx + 1}
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    onClick={() => {
                      if (idx === 0) return;
                      const updated = [...steps];
                      [updated[idx - 1], updated[idx]] = [updated[idx], updated[idx - 1]];
                      setSteps(updated.map((s, i) => ({ ...s, step_number: i + 1 })));
                    }}
                    disabled={idx === 0}
                    style={{ padding: 6, background: 'none', border: 'none', cursor: idx === 0 ? 'default' : 'pointer', color: idx === 0 ? 'var(--border)' : 'var(--text-secondary)', display: 'flex' }}
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    onClick={() => {
                      if (idx === steps.length - 1) return;
                      const updated = [...steps];
                      [updated[idx], updated[idx + 1]] = [updated[idx + 1], updated[idx]];
                      setSteps(updated.map((s, i) => ({ ...s, step_number: i + 1 })));
                    }}
                    disabled={idx === steps.length - 1}
                    style={{ padding: 6, background: 'none', border: 'none', cursor: idx === steps.length - 1 ? 'default' : 'pointer', color: idx === steps.length - 1 ? 'var(--border)' : 'var(--text-secondary)', display: 'flex' }}
                  >
                    <ChevronDown size={16} />
                  </button>
                  <button
                    onClick={() => {
                      const updated = steps.filter((_, i) => i !== idx).map((s, i) => ({ ...s, step_number: i + 1 }));
                      setSteps(updated);
                    }}
                    style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', display: 'flex' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <input
                value={step.title}
                onChange={(e) => {
                  const updated = [...steps];
                  updated[idx] = { ...updated[idx], title: e.target.value };
                  setSteps(updated);
                }}
                placeholder="Заголовок шага"
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 10,
                  border: '1px solid var(--border)', background: 'var(--tg-theme-bg-color, var(--bg))',
                  color: 'var(--text)', fontSize: 14, fontWeight: 600, boxSizing: 'border-box',
                }}
              />
              <textarea
                value={step.content}
                onChange={(e) => {
                  const updated = [...steps];
                  updated[idx] = { ...updated[idx], content: e.target.value };
                  setSteps(updated);
                }}
                rows={4}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 10,
                  border: '1px solid var(--border)', background: 'var(--tg-theme-bg-color, var(--bg))',
                  color: 'var(--text)', fontSize: 14, lineHeight: 1.6, resize: 'vertical',
                  boxSizing: 'border-box', fontFamily: 'inherit',
                }}
              />
            </div>
          ))}

          <button
            onClick={() => {
              setSteps([...steps, { step_number: steps.length + 1, title: '', content: '' }]);
            }}
            style={{
              padding: '12px', borderRadius: 12, border: '1px dashed var(--primary)',
              background: 'var(--primary-light)', color: 'var(--primary)',
              fontWeight: 700, fontSize: 14, cursor: 'pointer',
            }}
          >
            ➕ Добавить шаг
          </button>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: '12px 16px', borderTop: '1px solid var(--border)',
        background: 'var(--tg-theme-bg-color, var(--card))', flexShrink: 0,
      }}>
        <button
          onClick={handleSave}
          disabled={saving || !title.trim()}
          style={{
            width: '100%', padding: '14px', borderRadius: 12,
            fontWeight: 700, fontSize: 16, background: 'var(--primary)',
            color: 'white', border: 'none', cursor: saving ? 'default' : 'pointer',
            opacity: saving || !title.trim() ? 0.6 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          {saving
            ? <><Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Сохраняем...</>
            : '💾 Сохранить изменения'}
        </button>
      </div>

      {/* Delete confirm bottom sheet */}
      {showDeleteConfirm && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }}
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            style={{ width: '100%', background: 'var(--tg-theme-bg-color, #fff)', borderRadius: '20px 20px 0 0', padding: '24px 20px 32px', display: 'flex', flexDirection: 'column', gap: 12 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--border)', margin: '0 auto' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🗑️</div>
              <h3 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 700 }}>Удалить регламент?</h3>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)' }}>
                Это действие нельзя отменить. Весь прогресс сотрудников по этому регламенту будет удалён.
              </p>
            </div>
            <button
              onClick={handleDelete}
              disabled={deleting}
              style={{
                width: '100%', padding: '13px', borderRadius: 12, fontWeight: 700, fontSize: 15,
                background: '#dc2626', color: 'white', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                opacity: deleting ? 0.7 : 1,
              }}
            >
              {deleting ? <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> : 'Удалить'}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              style={{ width: '100%', padding: '12px', borderRadius: 12, fontWeight: 600, fontSize: 15, background: 'var(--tg-theme-secondary-bg-color, #f3f4f6)', color: 'var(--text)', border: 'none', cursor: 'pointer' }}
            >
              Отмена
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SOPEditPage;
