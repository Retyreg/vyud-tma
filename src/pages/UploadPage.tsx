import { useState } from 'react';
import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import FileUploader from '../components/FileUploader';
import { Loader2, AlertCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.vyud.online/api';
const API_KEY = import.meta.env.VITE_API_KEY || '';

type Step = 'idle' | 'uploading' | 'processing' | 'generating' | 'done';

const STEPS: Step[] = ['uploading', 'processing', 'generating', 'done'];
const STEP_LABELS: Record<Step, string> = {
  idle: '',
  uploading: 'Загрузка файла...',
  processing: 'Обработка содержимого...',
  generating: 'Генерация вопросов AI...',
  done: 'Готово!',
};

const DIFFICULTIES = [
  { value: 'easy', label: 'Лёгкий', emoji: '🟢' },
  { value: 'medium', label: 'Средний', emoji: '🟡' },
  { value: 'hard', label: 'Сложный', emoji: '🔴' },
];

const COUNTS = [5, 10, 15, 20];

const UploadPage: FC = () => {
  const { user, refreshUser } = useAuthContext();
  const navigate = useNavigate();

  const [file, setFile] = useState<File | null>(null);
  const [difficulty, setDifficulty] = useState('medium');
  const [count, setCount] = useState(10);
  const [step, setStep] = useState<Step>('idle');
  const [error, setError] = useState<string | null>(null);

  const hasCredits = (user?.credits ?? 0) >= 1;
  const isGenerating = step !== 'idle';

  const simulate = async (s: Step, ms: number) => {
    setStep(s);
    await new Promise((r) => setTimeout(r, ms));
  };

  const handleGenerate = async () => {
    if (!file || !user || !hasCredits) return;
    setError(null);

    try {
      await simulate('uploading', 600);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('num_questions', count.toString());
      formData.append('difficulty', difficulty);
      formData.append('language', 'Russian');
      formData.append('telegram_id', user.telegram_id?.toString() ?? '0');
      formData.append('username', user.username ?? '');

      await simulate('processing', 400);
      setStep('generating');

      const response = await fetch(`${API_URL}/generate-file`, {
        method: 'POST',
        headers: {
          'x-api-key': API_KEY,
          'x-telegram-init-data': typeof window !== 'undefined' ? ((window as any).Telegram?.WebApp?.initData || '') : '',
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Ошибка генерации');
      }

      await simulate('done', 500);
      await refreshUser();
      navigate(`/test/${data.test_id}`);
    } catch (e: any) {
      setStep('idle');
      setError(e.message || 'Произошла ошибка. Попробуйте ещё раз.');
    }
  };

  if (isGenerating) {
    const currentIdx = STEPS.indexOf(step);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', gap: '24px', textAlign: 'center' }}>
        <div style={{ position: 'relative', width: '72px', height: '72px' }}>
          <div style={{ width: '72px', height: '72px', border: '4px solid var(--primary-light)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
          <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '24px' }}>⚡</span>
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ fontSize: '22px', margin: '0 0 4px' }}>Создать тест</h1>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
          Загрузите файл — AI сгенерирует интерактивный тест
        </p>
      </div>

      {!hasCredits && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '14px', borderRadius: '12px',
          background: 'rgba(239,68,68,0.06)', border: '1px solid var(--error)',
        }}>
          <AlertCircle size={20} color="var(--error)" style={{ flexShrink: 0 }} />
          <div>
            <p style={{ margin: '0 0 2px', fontWeight: 700, fontSize: '14px', color: 'var(--error)' }}>Недостаточно кредитов</p>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>Пополните баланс в профиле</p>
          </div>
        </div>
      )}

      <FileUploader file={file} onFileSelect={setFile} onClear={() => setFile(null)} disabled={isGenerating} />

      <div>
        <label style={{ display: 'block', fontWeight: 700, fontSize: '14px', marginBottom: '10px' }}>Количество вопросов</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
          {COUNTS.map((c) => (
            <button
              key={c}
              onClick={() => setCount(c)}
              style={{
                padding: '10px', borderRadius: '10px', fontSize: '15px', fontWeight: 700,
                border: count === c ? '2px solid var(--primary)' : '1px solid var(--border)',
                background: count === c ? 'var(--primary-light)' : 'var(--tg-theme-secondary-bg-color, var(--bg))',
                color: count === c ? 'var(--primary)' : 'var(--text)',
                cursor: 'pointer',
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label style={{ display: 'block', fontWeight: 700, fontSize: '14px', marginBottom: '10px' }}>Сложность</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          {DIFFICULTIES.map((d) => (
            <button
              key={d.value}
              onClick={() => setDifficulty(d.value)}
              style={{
                padding: '10px 6px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
                border: difficulty === d.value ? '2px solid var(--primary)' : '1px solid var(--border)',
                background: difficulty === d.value ? 'var(--primary-light)' : 'var(--tg-theme-secondary-bg-color, var(--bg))',
                color: difficulty === d.value ? 'var(--primary)' : 'var(--text)',
                cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
              }}
            >
              <span>{d.emoji}</span>
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div style={{ display: 'flex', gap: '8px', padding: '12px 14px', borderRadius: '10px', background: 'rgba(239,68,68,0.06)', border: '1px solid var(--error)' }}>
          <AlertCircle size={16} color="var(--error)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--error)' }}>{error}</p>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '10px', background: 'var(--primary-light)' }}>
        <span style={{ fontSize: '13px' }}>⚡</span>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--primary)' }}>
          Будет списан <strong>1 кредит</strong> после успешной генерации
        </p>
      </div>

      <button
        onClick={handleGenerate}
        disabled={!file || !hasCredits || isGenerating}
        style={{
          width: '100%', padding: '14px', borderRadius: '12px', fontWeight: 700, fontSize: '16px',
          background: file && hasCredits ? 'var(--primary)' : 'var(--border)',
          color: file && hasCredits ? 'white' : 'var(--text-secondary)',
          border: 'none', cursor: file && hasCredits ? 'pointer' : 'default',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        }}
      >
        {isGenerating ? <><Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} /> Генерация...</> : '⚡ Сгенерировать тест'}
      </button>
    </div>
  );
};

export default UploadPage;
