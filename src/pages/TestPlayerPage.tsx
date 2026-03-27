import { useEffect, useState } from 'react';
import type { FC } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import QuestionCard from '../components/QuestionCard';
import type { Question } from '../components/QuestionCard';
import { ChevronLeft, Trophy, RotateCcw, BookOpen, Loader2 } from 'lucide-react';

const calcMastery = (correct: number, total: number): number => {
  if (total === 0) return 0;
  const norm = correct / total;
  return Math.round((1 / (1 + Math.exp(-(norm * 10 - 5)))) * 100);
};

const masteryLabel = (pct: number): { text: string; color: string; emoji: string } => {
  if (pct >= 93) return { text: 'Эксперт', color: 'var(--success)', emoji: '🏆' };
  if (pct >= 70) return { text: 'Хорошее владение', color: '#22c55e', emoji: '⭐' };
  if (pct >= 45) return { text: 'Базовый уровень', color: '#f59e0b', emoji: '📈' };
  return { text: 'Нужна практика', color: 'var(--error)', emoji: '💪' };
};

const TestPlayerPage: FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [title, setTitle] = useState('');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongIds, setWrongIds] = useState<number[]>([]);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const { data, error } = await supabase
          .from('quizzes')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        let qs = data.questions;
        if (typeof qs === 'string') qs = JSON.parse(qs);
        setQuestions(qs || []);
        setTitle(data.title || 'Тест');
      } catch (e) {
        console.error('Failed to load quiz:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [id]);

  const handleAnswer = (correct: boolean, _selected: number | number[]) => {
    if (correct) {
      setCorrectCount((c) => c + 1);
    } else {
      setWrongIds((ids) => [...ids, currentIdx]);
    }
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((i) => i + 1);
    } else {
      setFinished(true);
    }
  };

  const handleRetake = () => {
    setCurrentIdx(0);
    setCorrectCount(0);
    setWrongIds([]);
    setFinished(false);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '80vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px' }}>
        <Loader2 size={36} color="var(--primary)" style={{ animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Загрузка теста...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <p style={{ color: 'var(--error)' }}>Тест не найден или не содержит вопросов.</p>
        <button onClick={() => navigate('/tests')} style={{ marginTop: '16px', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
          ← К списку тестов
        </button>
      </div>
    );
  }

  // Results screen
  if (finished) {
    const total = questions.length;
    const mastery = calcMastery(correctCount, total);
    const { text, color, emoji } = masteryLabel(mastery);

    return (
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', minHeight: '100vh', background: 'var(--tg-theme-bg-color, var(--bg))' }}>
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <div style={{ fontSize: '64px', marginBottom: '12px' }}>{emoji}</div>
          <h1 style={{ fontSize: '26px', margin: '0 0 8px' }}>Тест завершён!</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>{title}</p>
        </div>

        <div style={{
          borderRadius: '16px', padding: '24px', textAlign: 'center',
          border: `2px solid ${color}`, background: `${color}12`,
        }}>
          <div style={{ fontSize: '48px', fontWeight: 900, color }}>{mastery}%</div>
          <div style={{ fontWeight: 700, fontSize: '18px', color, marginTop: '4px' }}>{text}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '8px' }}>
            Правильно: {correctCount} из {total}
          </div>
        </div>

        {wrongIds.length > 0 && (
          <div style={{ borderRadius: '12px', padding: '16px', background: 'var(--tg-theme-secondary-bg-color, var(--card))', border: '1px solid var(--border)' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '15px' }}>⚠️ Ошибки в вопросах:</h3>
            {wrongIds.map((idx) => (
              <p key={idx} style={{ margin: '0 0 4px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                • {(questions[idx].question || questions[idx].scenario || '').slice(0, 60)}...
              </p>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            onClick={handleRetake}
            style={{
              padding: '13px', borderRadius: '12px', fontWeight: 700, fontSize: '15px',
              background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}
          >
            <RotateCcw size={16} /> Пройти ещё раз
          </button>
          <button
            onClick={() => navigate('/tests')}
            style={{
              padding: '13px', borderRadius: '12px', fontWeight: 700, fontSize: '15px',
              background: 'var(--tg-theme-secondary-bg-color, var(--card))', color: 'var(--text)',
              border: '1px solid var(--border)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}
          >
            <BookOpen size={16} /> К списку тестов
          </button>
        </div>
      </div>
    );
  }

  const q = questions[currentIdx];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--tg-theme-bg-color, var(--bg))', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--border)', background: 'var(--tg-theme-bg-color, var(--card))' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex' }}>
          <ChevronLeft size={22} />
        </button>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Trophy size={14} color="var(--primary)" />
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary)' }}>{correctCount}/{currentIdx}</span>
        </div>
      </div>

      {/* Question */}
      <div style={{ flex: 1, padding: '20px 16px', overflowY: 'auto' }}>
        <QuestionCard
          key={currentIdx}
          question={q}
          index={currentIdx}
          total={questions.length}
          onAnswer={handleAnswer}
        />
      </div>

      {/* Next button */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', background: 'var(--tg-theme-bg-color, var(--card))' }}>
        <button
          onClick={handleNext}
          style={{
            width: '100%', padding: '13px', borderRadius: '12px', fontWeight: 700, fontSize: '15px',
            background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer',
          }}
        >
          {currentIdx < questions.length - 1 ? 'Следующий вопрос →' : 'Завершить тест'}
        </button>
      </div>
    </div>
  );
};

export default TestPlayerPage;
