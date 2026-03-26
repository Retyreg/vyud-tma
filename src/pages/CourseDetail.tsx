import { useEffect, useState } from 'react';
import type { FC } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ChevronLeft, CheckCircle2, XCircle, Info, Trophy, RefreshCw, RotateCcw } from 'lucide-react';
import WebApp from '@twa-dev/sdk';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.vyud.online/api';
const API_KEY = import.meta.env.VITE_API_KEY || '';

interface Question {
  scenario: string;
  options: string[];
  correct_option_id: number;
  explanation: string;
  question_type: string;
}

// Sigmoid mastery function (упрощённый IRT)
const calcMastery = (score: number, total: number): number => {
  if (total === 0) return 0;
  const normalized = score / total; // 0..1
  // Sigmoid: maps 0→~0.007, 0.5→0.5, 1→~0.993
  return Math.round((1 / (1 + Math.exp(-(normalized * 10 - 5)))) * 100);
};

const masteryLabel = (pct: number): { text: string; color: string } => {
  if (pct >= 93) return { text: 'Эксперт', color: 'var(--color-success)' };
  if (pct >= 70) return { text: 'Хорошее владение', color: '#22c55e' };
  if (pct >= 45) return { text: 'Базовый уровень', color: '#f59e0b' };
  return { text: 'Нужна практика', color: 'var(--color-danger)' };
};

const CourseDetail: FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [retakeIndices, setRetakeIndices] = useState<number[] | null>(null); // null = полный тест
  const [progressSaved, setProgressSaved] = useState(false);

  const triggerHaptic = (type: 'light' | 'medium' | 'success' | 'error') => {
    try {
      if (WebApp?.HapticFeedback) {
        if (type === 'success' || type === 'error') {
          WebApp.HapticFeedback.notificationOccurred(type);
        } else {
          WebApp.HapticFeedback.impactOccurred(type);
        }
      }
    } catch (_) {}
  };

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const { data, error } = await supabase
          .from('quizzes')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        if (data && typeof data.questions === 'string') {
          data.questions = JSON.parse(data.questions);
        }

        setQuiz(data);
      } catch (err) {
        console.error('Error fetching quiz:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [id]);

  const activeQuestions: Question[] = quiz
    ? retakeIndices !== null
      ? retakeIndices.map((i) => quiz.questions[i])
      : quiz.questions
    : [];

  const handleOptionSelect = (questionIndex: number, optionIndex: number) => {
    if (showResults) return;
    setAnswers({ ...answers, [questionIndex]: optionIndex });
    triggerHaptic('light');
  };

  const calculateScore = () => {
    let score = 0;
    activeQuestions.forEach((q, index) => {
      if (answers[index] === q.correct_option_id) score++;
    });
    return score;
  };

  const getWrongIndices = (): number[] =>
    activeQuestions
      .map((q, i) => (answers[i] !== q.correct_option_id ? i : -1))
      .filter((i) => i !== -1);

  const saveProgress = async (score: number, total: number, wrongIdx: number[]) => {
    if (progressSaved) return;
    try {
      const user = WebApp?.initDataUnsafe?.user;
      const telegram_id = user?.id || (import.meta.env.DEV ? 5701645456 : null);
      if (!telegram_id) return;

      // Пробуем через backend API
      try {
        await fetch(`${API_URL}/progress`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': API_KEY,
            'x-telegram-init-data': WebApp?.initData || '',
          },
          body: JSON.stringify({
            telegram_id,
            quiz_id: id,
            score,
            total,
            mastery_pct: calcMastery(score, total),
            wrong_question_ids: wrongIdx,
          }),
        });
      } catch (_) {
        // Fallback: прямая запись в Supabase
        await supabase.from('user_progress').insert({
          telegram_id,
          quiz_id: id,
          score,
          total,
          mastery_pct: calcMastery(score, total),
          wrong_question_ids: wrongIdx,
        });
      }
      setProgressSaved(true);
    } catch (err) {
      console.warn('Could not save progress:', err);
    }
  };

  const handleCheckResults = () => {
    setShowResults(true);
    triggerHaptic('success');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const score = calculateScore();
    const wrongIdx = getWrongIndices();
    saveProgress(score, activeQuestions.length, wrongIdx);
  };

  const handleRetakeWrong = () => {
    // Переводим локальные индексы обратно в глобальные индексы quiz
    const globalWrong = getWrongIndices().map((i) =>
      retakeIndices !== null ? retakeIndices[i] : i
    );
    setRetakeIndices(globalWrong);
    setAnswers({});
    setShowResults(false);
    setProgressSaved(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRetakeAll = () => {
    setRetakeIndices(null);
    setAnswers({});
    setShowResults(false);
    setProgressSaved(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Загрузка теста...</div>;
  if (!quiz) return <div style={{ padding: '20px', textAlign: 'center' }}>Тест не найден.</div>;

  const score = calculateScore();
  const total = activeQuestions.length;
  const mastery = calcMastery(score, total);
  const { text: masteryText, color: masteryColor } = masteryLabel(mastery);
  const wrongIndices = showResults ? getWrongIndices() : [];
  const isRetakeMode = retakeIndices !== null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          onClick={() => navigate('/')}
          style={{ padding: '8px', background: 'var(--tg-theme-secondary-bg-color)', borderRadius: '50%', border: '1px solid var(--color-border)', display: 'flex' }}
        >
          <ChevronLeft size={20} />
        </button>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <h1 style={{ fontSize: '18px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
            {quiz.title}
          </h1>
          {isRetakeMode && (
            <p style={{ fontSize: '11px', color: 'var(--color-danger)', margin: '2px 0 0', fontWeight: 600 }}>
              ⚡ Режим повтора ошибок ({total} вопр.)
            </p>
          )}
        </div>
      </div>

      {activeQuestions.map((q, qIndex) => (
        <Card
          key={qIndex}
          style={{
            border: showResults
              ? answers[qIndex] === q.correct_option_id
                ? '2px solid var(--color-success)'
                : '2px solid var(--color-danger)'
              : '1px solid var(--color-border)',
          }}
        >
          <CardHeader>
            <CardTitle style={{ fontSize: '15px', lineHeight: 1.4 }}>
              {qIndex + 1}. {q.scenario}
            </CardTitle>
          </CardHeader>
          <CardContent style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {q.options.map((option, oIndex) => {
              const isSelected = answers[qIndex] === oIndex;
              const isCorrect = q.correct_option_id === oIndex;

              let bgColor = 'var(--tg-theme-secondary-bg-color)';
              let borderColor = 'var(--color-border)';
              let textColor = 'var(--tg-theme-text-color)';

              if (isSelected && !showResults) {
                bgColor = 'var(--color-primary-light)';
                borderColor = 'var(--color-primary)';
                textColor = 'var(--color-primary)';
              }

              if (showResults) {
                if (isCorrect) {
                  bgColor = '#d1fae5';
                  borderColor = 'var(--color-success)';
                  textColor = '#065f46';
                } else if (isSelected && !isCorrect) {
                  bgColor = '#fee2e2';
                  borderColor = 'var(--color-danger)';
                  textColor = '#991b1b';
                }
              }

              return (
                <button
                  key={oIndex}
                  onClick={() => handleOptionSelect(qIndex, oIndex)}
                  disabled={showResults}
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${borderColor}`,
                    background: bgColor,
                    textAlign: 'left',
                    fontSize: '14px',
                    color: textColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s',
                  }}
                >
                  <span>{option}</span>
                  {showResults && isCorrect && <CheckCircle2 size={18} color="var(--color-success)" />}
                  {showResults && isSelected && !isCorrect && <XCircle size={18} color="var(--color-danger)" />}
                </button>
              );
            })}

            {showResults && q.explanation && (
              <div style={{ marginTop: '10px', padding: '12px', background: 'var(--tg-theme-bg-color)', borderRadius: 'var(--radius-sm)', display: 'flex', gap: '8px' }}>
                <Info size={16} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <p style={{ fontSize: '13px', fontStyle: 'italic', margin: 0 }}>{q.explanation}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {!showResults ? (
        <Button
          fullWidth
          size="lg"
          disabled={Object.keys(answers).length < total}
          onClick={handleCheckResults}
        >
          Проверить результаты
        </Button>
      ) : (
        <>
          {/* Mastery результат */}
          <Card style={{ textAlign: 'center', padding: '24px 20px' }}>
            <Trophy size={36} color={masteryColor} style={{ marginBottom: '12px' }} />
            <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 6px' }}>
              {score} / {total}
            </h2>

            {/* Mastery bar */}
            <div style={{ margin: '12px 0', width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                <span style={{ color: 'var(--tg-theme-hint-color)' }}>Освоение материала</span>
                <span style={{ fontWeight: 700, color: masteryColor }}>{mastery}%</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'var(--color-border)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                  width: `${mastery}%`,
                  height: '100%',
                  background: masteryColor,
                  borderRadius: '4px',
                  transition: 'width 0.6s ease',
                }} />
              </div>
            </div>

            <span style={{
              display: 'inline-block',
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 700,
              background: `${masteryColor}22`,
              color: masteryColor,
              marginBottom: '16px',
            }}>
              {masteryText}
            </span>

            {/* Слабые места */}
            {wrongIndices.length > 0 && (
              <div style={{
                background: 'var(--tg-theme-bg-color)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px',
                textAlign: 'left',
                marginBottom: '16px',
              }}>
                <p style={{ fontSize: '12px', fontWeight: 700, margin: '0 0 8px', color: 'var(--color-danger)' }}>
                  ⚠️ Слабые места ({wrongIndices.length} вопр.)
                </p>
                {wrongIndices.map((wi) => (
                  <p key={wi} style={{ fontSize: '12px', color: 'var(--tg-theme-hint-color)', margin: '0 0 4px', paddingLeft: '8px', borderLeft: '2px solid var(--color-danger)' }}>
                    {activeQuestions[wi].scenario.slice(0, 70)}{activeQuestions[wi].scenario.length > 70 ? '…' : ''}
                  </p>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {wrongIndices.length > 0 && (
                <Button
                  fullWidth
                  onClick={handleRetakeWrong}
                  style={{ backgroundColor: 'var(--color-danger)', color: 'white', display: 'flex', gap: '8px' }}
                >
                  <RotateCcw size={16} />
                  Повторить ошибки ({wrongIndices.length})
                </Button>
              )}
              <Button
                fullWidth
                variant="outline"
                onClick={handleRetakeAll}
                style={{ display: 'flex', gap: '8px' }}
              >
                <RefreshCw size={16} />
                Пройти заново
              </Button>
              <Button
                fullWidth
                style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
                onClick={() => navigate('/')}
              >
                На главную
              </Button>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default CourseDetail;
