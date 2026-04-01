import { useState } from 'react';
import type { FC } from 'react';
import FileUploader from '../components/FileUploader';
import { AlertCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.vyud.online/api';

type Step = 'idle' | 'uploading' | 'processing' | 'generating' | 'done';

const STEPS: Step[] = ['uploading', 'processing', 'generating', 'done'];
const STEP_LABELS: Record<Step, string> = {
  idle: '',
  uploading: 'Загрузка файла...',
  processing: 'Обработка содержимого...',
  generating: 'Построение графа AI...',
  done: 'Готово!',
};

const GraphPage: FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [topic, setTopic] = useState('');
  const [step, setStep] = useState<Step>('idle');
  const [error, setError] = useState<string | null>(null);
  const [nodeCount, setNodeCount] = useState<number | null>(null);

  const orgId = typeof localStorage !== 'undefined' ? localStorage.getItem('org_id') : null;
  const isGenerating = step !== 'idle' && step !== 'done';
  const isDone = step === 'done';

  const simulate = async (s: Step, ms: number) => {
    setStep(s);
    await new Promise<void>((r) => setTimeout(r, ms));
  };

  const handleCreate = async () => {
    if (!file || !orgId) return;
    setError(null);

    try {
      await simulate('uploading', 600);

      const formData = new FormData();
      formData.append('file', file);
      if (topic.trim()) {
        formData.append('topic', topic.trim());
      }

      await simulate('processing', 400);
      setStep('generating');

      const response = await fetch(`${API_URL}/orgs/${orgId}/courses/upload-pdf`, {
        method: 'POST',
        headers: {
          'x-telegram-init-data': typeof window !== 'undefined' ? ((window as Window & { Telegram?: { WebApp?: { initData?: string } } }).Telegram?.WebApp?.initData ?? '') : '',
        },
        body: formData,
      });

      const data: { node_count?: number; detail?: string } = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Ошибка создания графа');
      }

      setNodeCount(data.node_count ?? null);
      setStep('done');
    } catch (e: unknown) {
      setStep('idle');
      setError(e instanceof Error ? e.message : 'Произошла ошибка. Попробуйте ещё раз.');
    }
  };

  if (isGenerating) {
    const currentIdx = STEPS.indexOf(step);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', gap: '24px', textAlign: 'center' }}>
        <div style={{ position: 'relative', width: '72px', height: '72px' }}>
          <div style={{ width: '72px', height: '72px', border: '4px solid var(--primary-light)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
          <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '24px' }}>🧠</span>
        </div>

        <div>
          <h2 style={{ margin: '0 0 8px', fontSize: '20px' }}>{STEP_LABELS[step]}</h2>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
            Не закрывайте приложение, это займёт до 30 секунд
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          {STEPS.map((s, i) => (
            <div
              key={s}
              style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: i <= currentIdx ? 'var(--primary)' : 'var(--border)',
                transition: 'background 0.3s',
              }}
            />
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', maxWidth: '260px' }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: i <= currentIdx ? 1 : 0.3 }}>
              <span style={{ fontSize: '14px' }}>{i < currentIdx ? '✅' : i === currentIdx ? '⏳' : '○'}</span>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{STEP_LABELS[s]}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isDone) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', gap: '20px', textAlign: 'center' }}>
        <span style={{ fontSize: '56px' }}>🧠</span>
        <div>
          <h2 style={{ margin: '0 0 8px', fontSize: '22px' }}>
            ✅ Граф создан!{nodeCount !== null ? ` ${nodeCount} узлов` : ''}
          </h2>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
            Граф знаний успешно построен по вашему PDF
          </p>
        </div>
        <a
          href="https://vyud-lms.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-block', padding: '14px 28px', borderRadius: '12px',
            background: 'var(--primary)', color: 'white',
            fontWeight: 700, fontSize: '16px', textDecoration: 'none',
          }}
        >
          Открыть граф
        </a>
        <button
          onClick={() => { setStep('idle'); setFile(null); setTopic(''); setNodeCount(null); }}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '14px', color: 'var(--text-secondary)',
          }}
        >
          Создать ещё один
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ fontSize: '22px', margin: '0 0 4px' }}>Создать граф знаний</h1>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
          Загрузите PDF — AI построит граф концептов для обучения
        </p>
      </div>

      {!orgId && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '14px', borderRadius: '12px',
          background: 'rgba(239,68,68,0.06)', border: '1px solid var(--error)',
        }}>
          <AlertCircle size={20} color="var(--error)" style={{ flexShrink: 0 }} />
          <div>
            <p style={{ margin: '0 0 2px', fontWeight: 700, fontSize: '14px', color: 'var(--error)' }}>Нет организации</p>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>Сначала вступите в организацию</p>
          </div>
        </div>
      )}

      <FileUploader file={file} onFileSelect={setFile} onClear={() => setFile(null)} disabled={isGenerating} />

      <div>
        <label style={{ display: 'block', fontWeight: 700, fontSize: '14px', marginBottom: '8px' }}>
          Тема курса <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}>(опционально)</span>
        </label>
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Тема курса (опционально)"
          disabled={isGenerating}
          style={{
            width: '100%', padding: '12px 14px', borderRadius: '10px', fontSize: '14px',
            border: '1px solid var(--border)',
            background: 'var(--tg-theme-secondary-bg-color, var(--bg))',
            color: 'var(--text)',
            outline: 'none', boxSizing: 'border-box',
          }}
        />
      </div>

      {error && (
        <div style={{ display: 'flex', gap: '8px', padding: '12px 14px', borderRadius: '10px', background: 'rgba(239,68,68,0.06)', border: '1px solid var(--error)' }}>
          <AlertCircle size={16} color="var(--error)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--error)' }}>{error}</p>
        </div>
      )}

      <button
        onClick={handleCreate}
        disabled={!file || !orgId || isGenerating}
        style={{
          width: '100%', padding: '14px', borderRadius: '12px', fontWeight: 700, fontSize: '16px',
          background: file && orgId ? 'var(--primary)' : 'var(--border)',
          color: file && orgId ? 'white' : 'var(--text-secondary)',
          border: 'none', cursor: file && orgId ? 'pointer' : 'default',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        }}
      >
        ⚡ Создать граф
      </button>
    </div>
  );
};

export default GraphPage;
