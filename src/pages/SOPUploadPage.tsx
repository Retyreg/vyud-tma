import { useRef, useState } from 'react';
import type { FC, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import { uploadSOPPdf } from '../api/sop';
import type { LmsOrg } from '../api/lms';
import { ChevronLeft, Loader2, FileText, CheckCircle2 } from 'lucide-react';
import FreeLimitSheet from '../components/FreeLimitSheet';

type Stage = 'idle' | 'uploading' | 'done';

const STAGE_LABELS: Record<Stage, string> = {
  idle: '',
  uploading: 'AI обрабатывает PDF и генерирует квиз...',
  done: 'Регламент готов!',
};

const SOPUploadPage: FC = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();

  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [stage, setStage] = useState<Stage>('idle');
  const [result, setResult] = useState<{ sop_id: number; steps_count: number; quiz_count: number } | null>(null);
  const [error, setError] = useState('');
  const [showLimitSheet, setShowLimitSheet] = useState(false);

  const userKey = user?.telegram_id ? String(user.telegram_id) : '';

  const org: LmsOrg | null = (() => {
    try {
      const cached = localStorage.getItem('vyud_org');
      return cached ? JSON.parse(cached) : null;
    } catch { return null; }
  })();

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.type !== 'application/pdf') {
      setError('Допустимый формат — только PDF');
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError('Файл слишком большой. Максимум 10 МБ');
      return;
    }
    setFile(f);
    setError('');
    if (!title) setTitle(f.name.replace(/\.pdf$/i, ''));
  };

  const handleUpload = async () => {
    if (!file || !org || !userKey) return;
    setStage('uploading');
    setError('');
    try {
      const data = await uploadSOPPdf(org.org_id, file, userKey, title.trim() || undefined);
      setResult(data);
      setStage('done');
    } catch (e: any) {
      if (e.message?.includes('free_limit') || e.code === 'free_limit') {
        setStage('idle');
        setShowLimitSheet(true);
      } else {
        setError(e.message || 'Ошибка загрузки');
        setStage('idle');
      }
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--tg-theme-bg-color, var(--bg))', display: 'flex', flexDirection: 'column' }}>
      {showLimitSheet && <FreeLimitSheet onClose={() => setShowLimitSheet(false)} />}

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
        <div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>Загрузить PDF</p>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>AI создаст шаги и квиз</p>
        </div>
      </div>

      <div style={{ flex: 1, padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Done state */}
        {stage === 'done' && result && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, paddingTop: 24 }}>
            <CheckCircle2 size={64} color="#16a34a" />
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 8px' }}>Регламент создан!</h2>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)' }}>
                {title || file?.name}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ textAlign: 'center', padding: '16px 24px', borderRadius: 14, border: '1px solid var(--border)', background: 'var(--tg-theme-secondary-bg-color, var(--card))' }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--primary)' }}>{result.steps_count}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>шагов</div>
              </div>
              <div style={{ textAlign: 'center', padding: '16px 24px', borderRadius: 14, border: '1px solid var(--border)', background: 'var(--tg-theme-secondary-bg-color, var(--card))' }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--primary)' }}>{result.quiz_count}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>вопросов</div>
              </div>
            </div>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={() => navigate('/dashboard')}
                style={{ width: '100%', padding: '14px', borderRadius: 12, fontWeight: 700, fontSize: 16, background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer' }}
              >
                Открыть дашборд →
              </button>
              <button
                onClick={() => { setStage('idle'); setFile(null); setTitle(''); setResult(null); }}
                style={{ width: '100%', padding: '12px', borderRadius: 12, fontWeight: 600, fontSize: 15, background: 'var(--tg-theme-secondary-bg-color, #f3f4f6)', color: 'var(--text)', border: 'none', cursor: 'pointer' }}
              >
                Загрузить ещё
              </button>
            </div>
          </div>
        )}

        {/* Upload state */}
        {stage === 'uploading' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, paddingTop: 40 }}>
            <Loader2 size={52} color="var(--primary)" style={{ animation: 'spin 0.8s linear infinite' }} />
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: 16 }}>{STAGE_LABELS.uploading}</p>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
                Обычно 15–30 секунд
              </p>
            </div>
            <div style={{
              padding: '14px 18px', borderRadius: 12,
              background: 'var(--tg-theme-secondary-bg-color, var(--card))',
              border: '1px solid var(--border)', width: '100%',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <FileText size={20} color="var(--primary)" />
              <span style={{ fontSize: 14, color: 'var(--text)', fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {file?.name}
              </span>
            </div>
          </div>
        )}

        {/* Idle state */}
        {stage === 'idle' && (
          <>
            {/* Drop zone */}
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                border: `2px dashed ${file ? 'var(--primary)' : 'var(--border)'}`,
                borderRadius: 16, padding: '32px 20px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
                cursor: 'pointer', background: file ? 'var(--primary-light)' : 'transparent',
                transition: 'all 0.2s',
              }}
            >
              {file ? (
                <>
                  <FileText size={40} color="var(--primary)" />
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--primary)' }}>{file.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                      {(file.size / 1024).toFixed(0)} КБ · нажмите, чтобы сменить
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 48 }}>📄</div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Выберите PDF-файл</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>до 10 МБ · инструкция, регламент, скрипт</div>
                  </div>
                </>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />

            {/* Title override */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Название (необязательно)
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Будет взято из имени файла"
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: 12,
                  border: '1px solid var(--border)', background: 'var(--tg-theme-secondary-bg-color, var(--card))',
                  color: 'var(--text)', fontSize: 15, boxSizing: 'border-box',
                }}
              />
            </div>

            {error && (
              <div style={{ padding: '10px 14px', borderRadius: 10, background: '#fee2e2', color: '#dc2626', fontSize: 14 }}>
                {error}
              </div>
            )}

            <div style={{
              padding: '14px 16px', borderRadius: 12,
              background: 'var(--tg-theme-secondary-bg-color, var(--card))',
              border: '1px solid var(--border)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5,
            }}>
              AI прочитает документ, извлечёт <strong>5–7 шагов</strong> и создаст <strong>5 вопросов</strong> для проверки знаний.
            </div>

            <div style={{ marginTop: 'auto' }}>
              <button
                onClick={handleUpload}
                disabled={!file}
                style={{
                  width: '100%', padding: '14px', borderRadius: 14,
                  fontWeight: 700, fontSize: 16, background: 'var(--primary)',
                  color: 'white', border: 'none', cursor: file ? 'pointer' : 'default',
                  opacity: file ? 1 : 0.4,
                }}
              >
                🤖 Создать регламент
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SOPUploadPage;
