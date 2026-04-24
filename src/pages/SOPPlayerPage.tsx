import { useEffect, useRef, useState } from 'react';
import type { FC } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import { fetchSOP, completeSOP } from '../api/sop';
import type { SOPWithSteps, QuizQuestion } from '../api/sop';

/** Convert "A"/"B"/"C"/"D" to 0/1/2/3 */
const letterToIndex = (letter: string) => Math.max(0, 'ABCD'.indexOf(letter.toUpperCase()));
import { ChevronLeft, Loader2 } from 'lucide-react';

type Mode = 'steps' | 'quiz' | 'done';

const SOPPlayerPage: FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthContext();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sop, setSop] = useState<SOPWithSteps | null>(null);

  const [certToken, setCertToken] = useState<string | null>(null);

  // Steps state
  const [mode, setMode] = useState<Mode>('steps');
  const [stepIndex, setStepIndex] = useState(0);

  // Quiz state
  const [quizIndex, setQuizIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const quizStartRef = useRef<number>(0);
  const scoreRef = useRef<number>(0);

  const userKey = user?.telegram_id ? String(user.telegram_id) : '';

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const data = await fetchSOP(Number(id));
        data.steps = [...data.steps].sort((a, b) => a.step_number - b.step_number);
        setSop(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const startQuiz = () => {
    quizStartRef.current = Date.now();
    scoreRef.current = 0;
    setScore(0);
    setQuizIndex(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setMode('quiz');
  };

  const submitCompletion = async (s: number, maxScore: number) => {
    const timeSpent = Math.round((Date.now() - quizStartRef.current) / 1000);
    try {
      const result = await completeSOP(Number(id), {
        user_key: userKey,
        score: s,
        max_score: maxScore,
        time_spent_sec: timeSpent,
      });
      if (result.cert_token) setCertToken(result.cert_token);
    } catch (e) {
      console.error('Failed to save completion:', e);
    }
  };

  const skipToComplete = async () => {
    quizStartRef.current = Date.now();
    await submitCompletion(0, 0);
    setFinalScore(0);
    setMode('done');
  };

  const handleAnswer = async (optionIdx: number) => {
    if (!sop || isAnswered) return;

    const questions: QuizQuestion[] = sop.quiz_json ?? [];
    const question = questions[quizIndex];
    const correct = letterToIndex(question.correct_answer) === optionIdx;

    setSelectedAnswer(optionIdx);
    setIsAnswered(true);

    if (correct) {
      scoreRef.current += 1;
      setScore(scoreRef.current);
    }

    await new Promise<void>((r) => setTimeout(r, 1000));

    if (quizIndex < questions.length - 1) {
      setQuizIndex((i) => i + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      const s = scoreRef.current;
      setFinalScore(s);
      await submitCompletion(s, questions.length);
      setMode('done');
    }
  };

  // ── Loading / Error ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', flexDirection: 'column', gap: 12,
        background: 'var(--tg-theme-bg-color, var(--bg))',
      }}>
        <Loader2 size={32} color="var(--primary)" style={{ animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>Загрузка...</p>
      </div>
    );
  }

  if (error || !sop) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', padding: 24, gap: 12,
        background: 'var(--tg-theme-bg-color, var(--bg))',
      }}>
        <p style={{ color: 'var(--error)', fontSize: 15, textAlign: 'center' }}>
          {error || 'Регламент не найден'}
        </p>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '10px 24px', borderRadius: 10, background: 'var(--primary)',
            color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14,
          }}
        >
          ← Назад
        </button>
      </div>
    );
  }

  const steps = sop.steps;
  const questions: QuizQuestion[] = sop.quiz_json ?? [];
  const hasQuiz = questions.length > 0;

  // ── Done screen ──────────────────────────────────────────────────────────

  if (mode === 'done') {
    return (
      <div style={{
        minHeight: '100vh', background: 'var(--tg-theme-bg-color, var(--bg))',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '24px 16px', gap: 24,
      }}>
        <span style={{ fontSize: 72 }}>🎉</span>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: 22, margin: '0 0 8px', fontWeight: 700 }}>Регламент пройден!</h1>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)' }}>{sop.title}</p>
        </div>

        {hasQuiz && questions.length > 0 && (
          <div style={{
            borderRadius: 16, padding: '20px 40px', textAlign: 'center',
            border: '2px solid var(--primary)', background: 'var(--primary-light)',
          }}>
            <div style={{ fontSize: 40, fontWeight: 900, color: 'var(--primary)', lineHeight: 1 }}>
              {finalScore}/{questions.length}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6 }}>
              правильных ответов
            </div>
          </div>
        )}

        <div style={{ width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {certToken && (
            <a
              href={`https://lms.vyud.online/cert/${certToken}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '13px', borderRadius: 12, fontWeight: 700, fontSize: 15,
                background: '#7C3AED', color: 'white', textDecoration: 'none',
                width: '100%', boxSizing: 'border-box',
              }}
            >
              🏆 Открыть сертификат
            </a>
          )}
          <button
            onClick={() => navigate('/')}
            style={{
              width: '100%', padding: '14px', borderRadius: 12,
              fontWeight: 700, fontSize: 16, background: 'var(--primary)',
              color: 'white', border: 'none', cursor: 'pointer',
            }}
          >
            Вернуться к списку
          </button>
        </div>
      </div>
    );
  }

  // ── Shared header ────────────────────────────────────────────────────────

  const Header = ({ subtitle, onBack }: { subtitle: string; onBack: () => void }) => (
    <>
      <div style={{
        padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12,
        borderBottom: '1px solid var(--border)',
        background: 'var(--tg-theme-bg-color, var(--card))',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', minWidth: 44, minHeight: 44, alignItems: 'center' }}
        >
          <ChevronLeft size={22} />
        </button>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <p style={{
            margin: 0, fontWeight: 700, fontSize: 14,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {sop.title}
          </p>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>{subtitle}</p>
        </div>
      </div>
    </>
  );

  // ── Steps mode ───────────────────────────────────────────────────────────

  if (mode === 'steps') {
    const step = steps[stepIndex];
    const isLast = stepIndex === steps.length - 1;
    const progress = steps.length > 0 ? ((stepIndex + 1) / steps.length) * 100 : 100;

    return (
      <div style={{
        minHeight: '100vh', background: 'var(--tg-theme-bg-color, var(--bg))',
        display: 'flex', flexDirection: 'column',
      }}>
        <Header
          subtitle={`Шаг ${stepIndex + 1} из ${steps.length}`}
          onBack={() => navigate(-1)}
        />

        {/* Progress bar */}
        <div style={{ height: 3, background: 'var(--border)', flexShrink: 0 }}>
          <div style={{
            height: '100%', background: 'var(--primary)',
            width: `${progress}%`, transition: 'width 0.3s ease',
          }} />
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px' }}>
          {step?.image_url && (
            <img
              src={step.image_url}
              alt={step.title}
              style={{
                width: '100%', borderRadius: 12, marginBottom: 16,
                objectFit: 'cover', maxHeight: 200, display: 'block',
              }}
            />
          )}
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 12px', color: 'var(--text)', lineHeight: 1.3 }}>
            {step?.title}
          </h2>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--text)', margin: 0, whiteSpace: 'pre-wrap' }}>
            {step?.content}
          </p>
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 16px', borderTop: '1px solid var(--border)',
          background: 'var(--tg-theme-bg-color, var(--card))',
          display: 'flex', gap: 10, flexShrink: 0,
        }}>
          {stepIndex > 0 && (
            <button
              onClick={() => setStepIndex((i) => i - 1)}
              style={{
                flex: 1, padding: '13px', borderRadius: 12, fontWeight: 700, fontSize: 15,
                background: 'var(--tg-theme-secondary-bg-color, var(--card))',
                color: 'var(--text)', border: '1px solid var(--border)', cursor: 'pointer',
                minHeight: 44,
              }}
            >
              ← Назад
            </button>
          )}
          <button
            onClick={isLast ? (hasQuiz ? startQuiz : skipToComplete) : () => setStepIndex((i) => i + 1)}
            style={{
              flex: 1, padding: '13px', borderRadius: 12, fontWeight: 700, fontSize: 15,
              background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer',
              minHeight: 44,
            }}
          >
            {isLast ? (hasQuiz ? 'Перейти к тесту →' : '✅ Завершить') : 'Далее →'}
          </button>
        </div>
      </div>
    );
  }

  // ── Quiz mode ────────────────────────────────────────────────────────────

  if (mode === 'quiz') {
    const question = questions[quizIndex];
    const quizProgress = ((quizIndex + 1) / questions.length) * 100;
    const LABELS = ['A', 'B', 'C', 'D'];

    const optionStyle = (idx: number): React.CSSProperties => {
      const base: React.CSSProperties = {
        width: '100%', padding: '14px 16px', borderRadius: 12,
        fontWeight: 600, fontSize: 15, border: '1px solid var(--border)',
        cursor: isAnswered ? 'default' : 'pointer', textAlign: 'left',
        display: 'flex', alignItems: 'center', gap: 10,
        minHeight: 44, transition: 'background 0.15s',
      };
      if (!isAnswered) {
        return { ...base, background: 'var(--tg-theme-secondary-bg-color, var(--card))', color: 'var(--text)' };
      }
      if (idx === letterToIndex(question.correct_answer)) {
        return { ...base, background: '#dcfce7', color: '#16a34a', border: '1px solid #86efac' };
      }
      if (idx === selectedAnswer) {
        return { ...base, background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5' };
      }
      return { ...base, background: 'var(--tg-theme-secondary-bg-color, var(--card))', color: 'var(--text-secondary)', opacity: 0.5 };
    };

    return (
      <div style={{
        minHeight: '100vh', background: 'var(--tg-theme-bg-color, var(--bg))',
        display: 'flex', flexDirection: 'column',
      }}>
        <Header
          subtitle={`Вопрос ${quizIndex + 1} из ${questions.length} · ${score} правильных`}
          onBack={() => setMode('steps')}
        />

        {/* Progress bar */}
        <div style={{ height: 3, background: 'var(--border)', flexShrink: 0 }}>
          <div style={{
            height: '100%', background: 'var(--primary)',
            width: `${quizProgress}%`, transition: 'width 0.3s ease',
          }} />
        </div>

        {/* Question + options */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.5, margin: 0, color: 'var(--text)' }}>
            {question.question}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {question.options.map((option, idx) => (
              <button key={idx} onClick={() => handleAnswer(idx)} style={optionStyle(idx)}>
                <span style={{
                  fontWeight: 800, fontSize: 13, color: 'inherit',
                  background: 'rgba(0,0,0,0.08)', borderRadius: 6,
                  padding: '2px 7px', flexShrink: 0,
                }}>
                  {LABELS[idx]}
                </span>
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default SOPPlayerPage;
