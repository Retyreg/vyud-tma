import { useState } from 'react';
import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ChevronLeft, Send, Sparkles, AlertCircle } from 'lucide-react';
import WebApp from '@twa-dev/sdk';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.vyud.online/api';
const API_KEY = import.meta.env.VITE_API_KEY || '';

const CreateCourse: FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [text, setText] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [numQuestions, setNumQuestions] = useState(5);
  const [language, setLanguage] = useState('ru');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Безопасный вызов HapticFeedback
  const triggerHaptic = (type: 'light' | 'medium' | 'success' | 'error') => {
    try {
      if (WebApp?.HapticFeedback) {
        if (type === 'success' || type === 'error') {
          WebApp.HapticFeedback.notificationOccurred(type);
        } else {
          WebApp.HapticFeedback.impactOccurred(type);
        }
      }
    } catch (e) {
      console.log('Haptic feedback not available');
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else navigate('/');
  };

  const handleNext = () => {
    if (step === 1 && !text.trim()) {
      triggerHaptic('error');
      return;
    }
    setStep(step + 1);
    triggerHaptic('light');
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    triggerHaptic('medium');
    
    const user = WebApp?.initDataUnsafe?.user;
    const telegram_id = user?.id || (import.meta.env.DEV ? 5701645456 : 0); 
    const username = user?.username || (import.meta.env.DEV ? 'dmitrijvatutov' : 'user');

    if (!telegram_id) {
      setError('Пожалуйста, откройте приложение внутри Telegram');
      setIsGenerating(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
          'x-telegram-init-data': WebApp?.initData || ''
        },
        body: JSON.stringify({
          telegram_id,
          username,
          text,
          num_questions: numQuestions,
          difficulty,
          language
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Ошибка генерации');
      }

      const result = await response.json();
      
      if (result.success) {
        triggerHaptic('success');
        navigate(`/course/${result.test_id}`);
      }

    } catch (err: any) {
      console.error('Generation error:', err);
      setError(err.message);
      setIsGenerating(false);
      triggerHaptic('error');
    }
  };

  if (isGenerating) {
    return (
      <div style={{ display: 'flex', height: '80vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px', textAlign: 'center' }}>
        <div style={{ position: 'relative' }}>
          <div className="animate-spin" style={{ width: '60px', height: '60px', border: '4px solid var(--color-primary-light)', borderTopColor: 'var(--color-primary)', borderRadius: '50%' }}></div>
          <Sparkles style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} color="var(--color-primary)" size={24} />
        </div>
        <div>
          <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>Магия AI в процессе...</h2>
          <p className="text-muted">Это может занять до 30 секунд. Пожалуйста, не закрывайте приложение.</p>
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
        <h1 style={{ fontSize: '20px' }}>Создание курса</h1>
      </div>

      <div style={{ width: '100%', height: '6px', background: 'var(--color-border)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ width: `${(step / 3) * 100}%`, height: '100%', background: 'var(--color-primary)', transition: 'width 0.3s ease' }}></div>
      </div>

      {error && (
        <Card style={{ border: '1px solid var(--color-danger)', backgroundColor: '#fff1f1' }}>
          <CardContent style={{ padding: '12px', color: 'var(--color-danger)', fontSize: '14px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <AlertCircle size={18} />
            {error}
          </CardContent>
        </Card>
      )}

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Шаг 1: Материал</CardTitle>
            <CardDescription>Вставьте текст лекции, статью или просто опишите тему курса.</CardDescription>
          </CardHeader>
          <CardContent>
            <textarea
              style={{
                width: '100%',
                height: '200px',
                padding: '12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                fontFamily: 'inherit',
                fontSize: '14px',
                backgroundColor: 'var(--tg-theme-bg-color)',
                color: 'var(--color-text-primary)',
                resize: 'none'
              }}
              placeholder="Например: Основы квантовой физики или текст вашей статьи..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <Button onClick={handleNext} fullWidth style={{ marginTop: '20px' }}>
              Далее
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Шаг 2: Настройки</CardTitle>
            <CardDescription>Настройте сложность и количество вопросов.</CardDescription>
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
                      padding: '10px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '12px',
                      fontWeight: 600,
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
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Количество вопросов: {numQuestions}</label>
              <input 
                type="range" min="3" max="15" value={numQuestions} 
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
            <Button onClick={handleNext} fullWidth style={{ marginTop: '10px' }}>
              Далее
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Шаг 3: Проверка</CardTitle>
            <CardDescription>Всё готово к запуску генерации.</CardDescription>
          </CardHeader>
          <CardContent>
            <div style={{ background: 'var(--tg-theme-bg-color)', padding: '15px', borderRadius: 'var(--radius-sm)', marginBottom: '20px' }}>
              <p style={{ fontSize: '14px', marginBottom: '8px' }}><b>Материал:</b> {text.substring(0, 50)}...</p>
              <p style={{ fontSize: '14px', marginBottom: '8px' }}><b>Сложность:</b> {difficulty}</p>
              <p style={{ fontSize: '14px' }}><b>Вопросов:</b> {numQuestions}</p>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', background: 'rgba(79, 70, 229, 0.1)', padding: '12px', borderRadius: 'var(--radius-sm)', marginBottom: '20px' }}>
              <AlertCircle size={18} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <p style={{ fontSize: '12px', color: 'var(--color-primary)' }}>
                С вашего баланса будет списан <b>1 кредит</b> после успешной генерации.
              </p>
            </div>

            <Button onClick={handleGenerate} fullWidth variant="primary">
              <Send size={18} style={{ marginRight: '8px' }} />
              Сгенерировать курс
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CreateCourse;
