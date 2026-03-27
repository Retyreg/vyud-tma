import { useState, useRef } from 'react';
import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ChevronLeft, Send, Sparkles, AlertCircle, Upload, FileText, X } from 'lucide-react';
import WebApp from '@twa-dev/sdk';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.vyud.online/api';
const API_KEY = import.meta.env.VITE_API_KEY || '';

type InputMode = 'text' | 'file';

const ACCEPTED_TYPES = '.pdf,.docx,.doc,.txt,.pptx,.mp3,.mp4,.wav,.ogg';
const MAX_FILE_MB = 50;

const CreateCourse: FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<InputMode>('text');
  const [step, setStep] = useState(1);
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [difficulty, setDifficulty] = useState('medium');
  const [numQuestions, setNumQuestions] = useState(5);
  const [language, setLanguage] = useState('ru');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const triggerHaptic = (type: 'light' | 'medium' | 'success' | 'error') => {
    try {
      if (WebApp?.HapticFeedback) {
        if (type === 'success' || type === 'error') WebApp.HapticFeedback.notificationOccurred(type);
        else WebApp.HapticFeedback.impactOccurred(type);
      }
    } catch (_) {}
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else navigate('/');
  };

  const handleNext = () => {
    if (mode === 'text' && step === 1 && !text.trim()) {
      triggerHaptic('error');
      setError('Введите текст для генерации теста');
      return;
    }
    if (mode === 'file' && step === 1 && !file) {
      triggerHaptic('error');
      setError('Выберите файл');
      return;
    }
    setError(null);
    setStep(step + 1);
    triggerHaptic('light');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_FILE_MB * 1024 * 1024) {
      setError(`Файл слишком большой (максимум ${MAX_FILE_MB} МБ)`);
      return;
    }
    setFile(f);
    setError(null);
  };

  const getUser = () => {
    const user = WebApp?.initDataUnsafe?.user;
    return {
      telegram_id: user?.id || (import.meta.env.DEV ? 5701645456 : 0),
      username: user?.username || (import.meta.env.DEV ? 'dmitrijvatutov' : 'user'),
    };
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    triggerHaptic('medium');

    const { telegram_id, username } = getUser();
    if (!telegram_id) {
      setError('Откройте приложение внутри Telegram');
      setIsGenerating(false);
      return;
    }

    const lang_full = language === 'ru' ? 'Russian' : 'English';

    try {
      let result: any;

      if (mode === 'text') {
        const response = await fetch(`${API_URL}/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': API_KEY,
            'x-telegram-init-data': WebApp?.initData || '',
          },
          body: JSON.stringify({ telegram_id, username, text, num_questions: numQuestions, difficulty, language }),
        });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.detail || 'Ошибка генерации');
        }
        result = await response.json();
      } else {
        // file upload
        const formData = new FormData();
        formData.append('file', file!);
        formData.append('telegram_id', String(telegram_id));
        formData.append('username', username);
        formData.append('num_questions', String(numQuestions));
        formData.append('difficulty', difficulty);
        formData.append('language', lang_full);

        const response = await fetch(`${API_URL}/generate-file`, {
          method: 'POST',
          headers: {
            'x-api-key': API_KEY,
            'x-telegram-init-data': WebApp?.initData || '',
          },
          body: formData,
        });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.detail || 'Ошибка обработки файла');
        }
        result = await response.json();
      }

      if (result.success) {
        triggerHaptic('success');
        navigate(`/course/${result.test_id}`);
      }
    } catch (err: any) {
      console.error('Generation error:', err);
      setError(err.message);
      triggerHaptic('error');
    } finally {
      setIsGenerating(false);
    }
  };

  if (isGenerating) {
    return (
      <div style={{ display: 'flex', height: '80vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px', textAlign: 'center' }}>
        <div style={{ position: 'relative' }}>
          <div className="animate-spin" style={{ width: '60px', height: '60px', border: '4px solid var(--color-primary-light)', borderTopColor: 'var(--color-primary)', borderRadius: '50%' }} />
          <Sparkles style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} color="var(--color-primary)" size={24} />
        </div>
        <div>
          <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>Магия AI в процессе...</h2>
          <p className="text-muted">Это может занять до 30 секунд.<br />Пожалуйста, не закрывайте приложение.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button onClick={handleBack} style={{ padding: '8px', background: 'var(--tg-theme-secondary-bg-color)', borderRadius: '50%', border: '1px solid var(--color-border)', display: 'flex' }}>
          <ChevronLeft size={20} />
        </button>
        <h1 style={{ fontSize: '20px' }}>Создание теста</h1>
      </div>

      <div style={{ width: '100%', height: '6px', background: 'var(--color-border)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ width: `${(step / 3) * 100}%`, height: '100%', background: 'var(--color-primary)', transition: 'width 0.3s ease' }} />
      </div>

      {error && (
        <Card style={{ border: '1px solid var(--color-danger)', backgroundColor: 'rgba(239,68,68,0.06)' }}>
          <CardContent style={{ padding: '12px', color: 'var(--color-danger)', fontSize: '14px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            {error}
          </CardContent>
        </Card>
      )}

      {/* ── Шаг 1: Материал ── */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Шаг 1: Материал</CardTitle>
            <CardDescription>Введите текст или загрузите файл</CardDescription>
          </CardHeader>
          <CardContent style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Tabs */}
            <div style={{ display: 'flex', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
              {(['text', 'file'] as InputMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError(null); }}
                  style={{
                    flex: 1, padding: '10px', fontSize: '14px', fontWeight: mode === m ? 700 : 400,
                    background: mode === m ? 'var(--color-primary)' : 'var(--tg-theme-secondary-bg-color)',
                    color: mode === m ? 'white' : 'var(--tg-theme-text-color)',
                    border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  }}
                >
                  {m === 'text' ? <><FileText size={15} /> Текст</> : <><Upload size={15} /> Файл</>}
                </button>
              ))}
            </div>

            {mode === 'text' ? (
              <textarea
                style={{
                  width: '100%', height: '200px', padding: '12px',
                  borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)',
                  fontFamily: 'inherit', fontSize: '14px',
                  backgroundColor: 'var(--tg-theme-bg-color)', color: 'var(--color-text-primary)', resize: 'none',
                  boxSizing: 'border-box',
                }}
                placeholder="Вставьте текст лекции, статью или опишите тему..."
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            ) : (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_TYPES}
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                {file ? (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '14px', borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-primary)', background: 'rgba(79,70,229,0.06)',
                  }}>
                    <FileText size={22} color="var(--color-primary)" style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {file.name}
                      </p>
                      <p className="text-muted" style={{ margin: 0, fontSize: '12px' }}>
                        {(file.size / 1024 / 1024).toFixed(1)} МБ
                      </p>
                    </div>
                    <button onClick={() => setFile(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', color: 'var(--tg-theme-hint-color)' }}>
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      width: '100%', padding: '32px 16px',
                      borderRadius: 'var(--radius-sm)', border: '2px dashed var(--color-border)',
                      background: 'var(--tg-theme-secondary-bg-color)', cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
                      color: 'var(--tg-theme-hint-color)',
                    }}
                  >
                    <Upload size={28} />
                    <span style={{ fontSize: '14px', fontWeight: 600 }}>Нажмите чтобы выбрать файл</span>
                    <span style={{ fontSize: '11px' }}>PDF, DOCX, TXT, PPTX, MP3, MP4 · до {MAX_FILE_MB} МБ</span>
                  </button>
                )}
              </div>
            )}

            <Button onClick={handleNext} fullWidth>
              Далее
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Шаг 2: Настройки ── */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Шаг 2: Настройки</CardTitle>
            <CardDescription>Настройте сложность и количество вопросов</CardDescription>
          </CardHeader>
          <CardContent style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Сложность</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                {['easy', 'medium', 'hard'].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => { setDifficulty(lvl); triggerHaptic('light'); }}
                    style={{
                      padding: '10px', borderRadius: 'var(--radius-sm)', fontSize: '12px', fontWeight: 600,
                      border: difficulty === lvl ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                      background: difficulty === lvl ? 'var(--color-primary-light)' : 'var(--tg-theme-secondary-bg-color)',
                      color: difficulty === lvl ? 'var(--color-primary)' : 'var(--color-text-primary)',
                    }}
                  >
                    {lvl === 'easy' ? 'Легко' : lvl === 'medium' ? 'Средне' : 'Сложно'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
                Количество вопросов: {numQuestions}
              </label>
              <input type="range" min="3" max="15" value={numQuestions}
                onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--color-primary)' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Язык теста</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--tg-theme-bg-color)', color: 'var(--color-text-primary)' }}
              >
                <option value="ru">Русский</option>
                <option value="en">English</option>
              </select>
            </div>
            <Button onClick={handleNext} fullWidth>Далее</Button>
          </CardContent>
        </Card>
      )}

      {/* ── Шаг 3: Проверка ── */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Шаг 3: Проверка</CardTitle>
            <CardDescription>Всё готово к запуску генерации</CardDescription>
          </CardHeader>
          <CardContent>
            <div style={{ background: 'var(--tg-theme-secondary-bg-color)', padding: '15px', borderRadius: 'var(--radius-sm)', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <p style={{ fontSize: '14px', margin: 0 }}>
                <b>Источник:</b>{' '}
                {mode === 'file' ? `📎 ${file?.name}` : `📝 ${text.substring(0, 50)}...`}
              </p>
              <p style={{ fontSize: '14px', margin: 0 }}><b>Сложность:</b> {difficulty === 'easy' ? 'Легко' : difficulty === 'medium' ? 'Средне' : 'Сложно'}</p>
              <p style={{ fontSize: '14px', margin: 0 }}><b>Вопросов:</b> {numQuestions}</p>
              <p style={{ fontSize: '14px', margin: 0 }}><b>Язык:</b> {language === 'ru' ? 'Русский' : 'English'}</p>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', background: 'rgba(79,70,229,0.08)', padding: '12px', borderRadius: 'var(--radius-sm)', marginBottom: '20px' }}>
              <AlertCircle size={18} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <p style={{ fontSize: '12px', color: 'var(--color-primary)', margin: 0 }}>
                С вашего баланса будет списан <b>1 кредит</b> после успешной генерации.
              </p>
            </div>

            <Button onClick={handleGenerate} fullWidth variant="primary">
              <Send size={18} style={{ marginRight: '8px' }} />
              Сгенерировать тест
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CreateCourse;
