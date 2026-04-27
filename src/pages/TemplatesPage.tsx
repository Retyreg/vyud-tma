import { useEffect, useState } from 'react';
import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import { fetchTemplates, cloneTemplate } from '../api/sop';
import type { SOPTemplateItem } from '../api/sop';
import type { LmsOrg } from '../api/lms';
import { Loader2, ChevronLeft } from 'lucide-react';
import FreeLimitSheet from '../components/FreeLimitSheet';

const CATEGORY_LABELS: Record<string, string> = {
  HoReCa: '🍽️ HoReCa',
  Retail: '🛒 Retail',
  FMCG: '📦 FMCG',
};

const TemplatesPage: FC = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<SOPTemplateItem[]>([]);
  const [cloning, setCloning] = useState<number | null>(null);
  const [cloned, setCloned] = useState<Set<number>>(new Set());
  const [showLimitSheet, setShowLimitSheet] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const userKey = user?.telegram_id ? String(user.telegram_id) : '';

  const org: LmsOrg | null = (() => {
    try {
      const cached = localStorage.getItem('vyud_org');
      return cached ? JSON.parse(cached) : null;
    } catch { return null; }
  })();

  useEffect(() => {
    fetchTemplates()
      .then(setTemplates)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleClone = async (template: SOPTemplateItem) => {
    if (!org) return;
    setCloning(template.id);
    try {
      await cloneTemplate(org.org_id, template.id, userKey);
      setCloned((prev) => new Set(prev).add(template.id));
    } catch (e: any) {
      if (e.code === 'free_limit' || e.message?.includes('free_limit')) {
        setShowLimitSheet(true);
      } else {
        alert(e.message || 'Ошибка при добавлении шаблона');
      }
    } finally {
      setCloning(null);
    }
  };

  const allCategories = Array.from(new Set(templates.map((t) => t.category)));

  // Filter + group
  const q = search.trim().toLowerCase();
  const filteredTemplates = templates.filter((t) => {
    if (activeCategory && t.category !== activeCategory) return false;
    if (q && !t.title.toLowerCase().includes(q) && !(t.description?.toLowerCase().includes(q) ?? false)) return false;
    return true;
  });
  const grouped = filteredTemplates.reduce<Record<string, SOPTemplateItem[]>>((acc, t) => {
    (acc[t.category] ??= []).push(t);
    return acc;
  }, {});

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: 12 }}>
        <Loader2 size={32} color="var(--primary)" style={{ animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>Загрузка шаблонов...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <p style={{ color: 'var(--error)', fontSize: 14 }}>{error}</p>
        <button onClick={() => window.location.reload()} style={{ marginTop: 12, padding: '10px 24px', borderRadius: 10, background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
          Повторить
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {showLimitSheet && <FreeLimitSheet onClose={() => setShowLimitSheet(false)} />}
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', minWidth: 36, minHeight: 36, alignItems: 'center' }}
        >
          <ChevronLeft size={22} />
        </button>
        <div>
          <h1 style={{ fontSize: 20, margin: 0, fontWeight: 700 }}>Шаблоны регламентов</h1>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
            Готовые СОПы для вашей отрасли
          </p>
        </div>
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Поиск по шаблонам..."
        style={{
          width: '100%', padding: '10px 14px', borderRadius: 10,
          border: '1px solid var(--border)', background: 'var(--tg-theme-secondary-bg-color, var(--card))',
          color: 'var(--text)', fontSize: 14, outline: 'none', boxSizing: 'border-box',
        }}
      />

      {/* Category chips */}
      {allCategories.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveCategory(null)}
            style={{
              padding: '5px 12px', borderRadius: 16, fontSize: 12, fontWeight: 600,
              cursor: 'pointer',
              background: !activeCategory ? 'var(--primary)' : 'transparent',
              color: !activeCategory ? 'white' : 'var(--text-secondary)',
              border: !activeCategory ? 'none' : '1px solid var(--border)',
            }}
          >
            Все
          </button>
          {allCategories.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCategory(activeCategory === c ? null : c)}
              style={{
                padding: '5px 12px', borderRadius: 16, fontSize: 12, fontWeight: 600,
                cursor: 'pointer',
                background: activeCategory === c ? 'var(--primary)' : 'transparent',
                color: activeCategory === c ? 'white' : 'var(--text-secondary)',
                border: activeCategory === c ? 'none' : '1px solid var(--border)',
              }}
            >
              {CATEGORY_LABELS[c] ?? c}
            </button>
          ))}
        </div>
      )}

      {!org?.is_manager && (
        <div style={{ padding: '12px 16px', borderRadius: 12, background: '#fef9c3', border: '1px solid #fde68a' }}>
          <p style={{ margin: 0, fontSize: 13, color: '#854d0e' }}>
            Добавлять шаблоны в организацию могут только менеджеры
          </p>
        </div>
      )}

      {/* Empty state */}
      {filteredTemplates.length === 0 && (
        <div style={{ padding: '40px 0', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Ничего не найдено</p>
        </div>
      )}

      {/* Template list grouped by category */}
      {Object.entries(grouped).map(([category, items]) => (
        <div key={category}>
          <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {CATEGORY_LABELS[category] ?? category}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {items.map((t) => {
              const done = cloned.has(t.id);
              const isCloning = cloning === t.id;
              return (
                <div
                  key={t.id}
                  style={{
                    padding: '14px 16px', borderRadius: 14,
                    border: `1px solid ${done ? '#86efac' : 'var(--border)'}`,
                    background: done ? '#f0fdf4' : 'var(--tg-theme-secondary-bg-color, var(--card))',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 4 }}>
                        {t.title}
                      </div>
                      {t.description && (
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.4 }}>
                          {t.description}
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 6 }}>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 600, background: 'var(--primary-light)', color: 'var(--primary)' }}>
                          {t.steps_count} шагов
                        </span>
                        {t.quiz_count > 0 && (
                          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 600, background: '#f3f4f6', color: 'var(--text-secondary)' }}>
                            {t.quiz_count} вопросов
                          </span>
                        )}
                      </div>
                    </div>

                    {org?.is_manager && (
                      <button
                        onClick={() => handleClone(t)}
                        disabled={done || isCloning}
                        style={{
                          flexShrink: 0, padding: '8px 14px', borderRadius: 10,
                          fontWeight: 700, fontSize: 13, border: 'none', cursor: done ? 'default' : 'pointer',
                          minHeight: 36, minWidth: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                          background: done ? '#dcfce7' : 'var(--primary)',
                          color: done ? '#16a34a' : 'white',
                          opacity: isCloning ? 0.7 : 1,
                        }}
                      >
                        {isCloning
                          ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} />
                          : done ? '✓ Добавлен' : '+ Добавить'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TemplatesPage;
