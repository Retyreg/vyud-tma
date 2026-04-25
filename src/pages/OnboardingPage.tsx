import { useState } from 'react';
import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import { createOrg } from '../api/lms';
import { fetchTemplates, cloneTemplate } from '../api/sop';
import type { SOPTemplateItem } from '../api/sop';
import { Loader2 } from 'lucide-react';
import FreeLimitSheet from '../components/FreeLimitSheet';

type Step = 'name' | 'template' | 'invite';

const OnboardingPage: FC = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const userKey = user?.telegram_id ? String(user.telegram_id) : '';

  const [step, setStep] = useState<Step>('name');
  const [orgName, setOrgName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [org, setOrg] = useState<{ org_id: number; org_name: string; invite_code: string } | null>(null);
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);

  const [templates, setTemplates] = useState<SOPTemplateItem[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [cloning, setCloning] = useState<number | null>(null);
  const [cloned, setCloned] = useState<Set<number>>(new Set());
  const [showLimitSheet, setShowLimitSheet] = useState(false);

  const handleCreateOrg = async () => {
    if (!orgName.trim() || !userKey) return;
    setLoading(true);
    setError('');
    try {
      const created = await createOrg(orgName.trim(), userKey);
      setOrg(created);
      const link = `https://t.me/VyudAiBot?startapp=invite_${created.invite_code}`;
      setInviteLink(link);
      localStorage.setItem('vyud_org', JSON.stringify({
        org_id: created.org_id,
        org_name: created.org_name,
        invite_code: created.invite_code,
        is_manager: true,
      }));

      // Preload templates for next step
      setTemplatesLoading(true);
      fetchTemplates()
        .then(setTemplates)
        .finally(() => setTemplatesLoading(false));

      setStep('template');
    } catch (e: any) {
      setError(e.message || 'Ошибка создания организации');
    } finally {
      setLoading(false);
    }
  };

  const handleClone = async (template: SOPTemplateItem) => {
    if (!org) return;
    setCloning(template.id);
    try {
      await cloneTemplate(org.org_id, template.id, userKey);
      setCloned((prev) => new Set(prev).add(template.id));
    } catch (e: any) {
      if (e.code === 'free_limit') {
        setShowLimitSheet(true);
      } else {
        setError(e.message || 'Ошибка добавления шаблона');
      }
    } finally {
      setCloning(null);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  const progressPct = step === 'name' ? 33 : step === 'template' ? 66 : 100;

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--tg-theme-bg-color, var(--bg))',
      display: 'flex', flexDirection: 'column',
    }}>
      {showLimitSheet && <FreeLimitSheet onClose={() => setShowLimitSheet(false)} />}

      {/* Progress bar */}
      <div style={{ height: 4, background: 'var(--border)', flexShrink: 0 }}>
        <div style={{ height: '100%', background: 'var(--primary)', width: `${progressPct}%`, transition: 'width 0.4s ease' }} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '32px 20px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* ── Step 1: Org name ── */}
        {step === 'name' && (
          <>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🏢</div>
              <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 8px' }}>Создайте организацию</h1>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Введите название вашей компании или команды
              </p>
            </div>

            <div>
              <input
                autoFocus
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !loading && orgName.trim() && handleCreateOrg()}
                placeholder="Например: Кафе Лето, Отдел продаж..."
                style={{
                  width: '100%', padding: '14px 16px', borderRadius: 14,
                  border: '1.5px solid var(--border)', background: 'var(--tg-theme-secondary-bg-color, var(--card))',
                  color: 'var(--text)', fontSize: 16, boxSizing: 'border-box',
                }}
              />
              {error && <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--error)' }}>{error}</p>}
            </div>

            <div style={{ fontSize: 13, color: 'var(--text-secondary)', background: 'var(--tg-theme-secondary-bg-color, var(--card))', borderRadius: 12, padding: '12px 16px' }}>
              После создания вы сможете добавить первый регламент и пригласить сотрудников по ссылке.
            </div>

            <div style={{ marginTop: 'auto' }}>
              <button
                onClick={handleCreateOrg}
                disabled={loading || !orgName.trim()}
                style={{
                  width: '100%', padding: '14px', borderRadius: 14,
                  fontWeight: 700, fontSize: 16, background: 'var(--primary)',
                  color: 'white', border: 'none', cursor: 'pointer',
                  opacity: loading || !orgName.trim() ? 0.6 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                {loading
                  ? <><Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} /> Создаём...</>
                  : 'Создать →'}
              </button>
            </div>
          </>
        )}

        {/* ── Step 2: Pick template ── */}
        {step === 'template' && (
          <>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
              <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 8px' }}>Добавьте первый регламент</h1>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Выберите готовый шаблон для вашей сферы
              </p>
            </div>

            {templatesLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
                <Loader2 size={28} color="var(--primary)" style={{ animation: 'spin 0.8s linear infinite' }} />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {templates.slice(0, 6).map((t) => {
                  const done = cloned.has(t.id);
                  const isCloning = cloning === t.id;
                  return (
                    <div key={t.id} style={{
                      padding: '14px 16px', borderRadius: 14,
                      border: `1px solid ${done ? '#86efac' : 'var(--border)'}`,
                      background: done ? '#f0fdf4' : 'var(--tg-theme-secondary-bg-color, var(--card))',
                      display: 'flex', alignItems: 'center', gap: 12,
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{t.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                          {t.steps_count} шагов · {t.category}
                        </div>
                      </div>
                      <button
                        onClick={() => handleClone(t)}
                        disabled={done || isCloning}
                        style={{
                          flexShrink: 0, padding: '8px 14px', borderRadius: 10,
                          fontWeight: 700, fontSize: 13, border: 'none',
                          cursor: done ? 'default' : 'pointer',
                          background: done ? '#dcfce7' : 'var(--primary)',
                          color: done ? '#16a34a' : 'white',
                          display: 'flex', alignItems: 'center', gap: 4,
                          opacity: isCloning ? 0.7 : 1,
                        }}
                      >
                        {isCloning ? <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> : done ? '✓' : '+'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 'auto' }}>
              <button
                onClick={() => setStep('invite')}
                disabled={cloned.size === 0}
                style={{
                  width: '100%', padding: '14px', borderRadius: 14,
                  fontWeight: 700, fontSize: 16, background: 'var(--primary)',
                  color: 'white', border: 'none', cursor: 'pointer',
                  opacity: cloned.size === 0 ? 0.4 : 1,
                }}
              >
                Далее →
              </button>
              <button
                onClick={() => setStep('invite')}
                style={{
                  width: '100%', padding: '12px', borderRadius: 14,
                  fontWeight: 600, fontSize: 15,
                  background: 'var(--tg-theme-secondary-bg-color, #f3f4f6)', color: 'var(--text-secondary)',
                  border: 'none', cursor: 'pointer',
                }}
              >
                Пропустить
              </button>
            </div>
          </>
        )}

        {/* ── Step 3: Invite link ── */}
        {step === 'invite' && (
          <>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔗</div>
              <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 8px' }}>Пригласите сотрудников</h1>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Отправьте эту ссылку команде — они автоматически вступят в организацию
              </p>
            </div>

            <div style={{
              padding: '16px', borderRadius: 14,
              border: '1.5px solid var(--primary)', background: 'var(--primary-light)',
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', marginBottom: 8 }}>
                Ссылка-приглашение
              </div>
              <div style={{ fontSize: 13, color: 'var(--text)', wordBreak: 'break-all', lineHeight: 1.5 }}>
                {inviteLink}
              </div>
            </div>

            <button
              onClick={handleCopy}
              style={{
                width: '100%', padding: '14px', borderRadius: 14,
                fontWeight: 700, fontSize: 16,
                background: copied ? '#16a34a' : 'var(--primary)',
                color: 'white', border: 'none', cursor: 'pointer',
                transition: 'background 0.2s',
              }}
            >
              {copied ? '✓ Скопировано!' : '📋 Копировать ссылку'}
            </button>

            <div style={{ marginTop: 'auto' }}>
              <button
                onClick={() => navigate('/', { replace: true })}
                style={{
                  width: '100%', padding: '14px', borderRadius: 14,
                  fontWeight: 700, fontSize: 16,
                  background: 'var(--tg-theme-secondary-bg-color, #f3f4f6)', color: 'var(--text)',
                  border: 'none', cursor: 'pointer',
                }}
              >
                Открыть дашборд →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default OnboardingPage;
