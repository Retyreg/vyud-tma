import { useState } from 'react';
import type { FC } from 'react';
import { CheckCircle2, XCircle, Info } from 'lucide-react';

export interface Question {
  question?: string;
  scenario?: string; // backward compat
  options: string[];
  correct_option_id: number;
  correct_option_ids?: number[];
  explanation: string;
  question_type: 'single_choice' | 'multiple_choice' | 'true_false' | 'matching';
}

interface QuestionCardProps {
  question: Question;
  index: number;
  total: number;
  onAnswer: (correct: boolean, selectedId: number | number[]) => void;
}

const QuestionCard: FC<QuestionCardProps> = ({ question, index, total, onAnswer }) => {
  const [selected, setSelected] = useState<number | null>(null);
  const [multiSelected, setMultiSelected] = useState<number[]>([]);
  const [answered, setAnswered] = useState(false);

  const text = question.question || question.scenario || '';
  const qType = question.question_type || 'single_choice';

  const handleSingle = (idx: number) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    const correct = idx === question.correct_option_id;
    onAnswer(correct, idx);
  };

  const handleTrueFalse = (val: boolean) => {
    if (answered) return;
    const idx = val ? 0 : 1; // 0=Верно, 1=Неверно
    setSelected(idx);
    setAnswered(true);
    const correct = question.correct_option_id === idx;
    onAnswer(correct, idx);
  };

  const handleMultiCheck = () => {
    if (answered) return;
    setAnswered(true);
    const correctIds = question.correct_option_ids || [question.correct_option_id];
    const correct = correctIds.length === multiSelected.length &&
      correctIds.every((id) => multiSelected.includes(id));
    onAnswer(correct, multiSelected);
  };

  const getOptionStyle = (idx: number): React.CSSProperties => {
    const base: React.CSSProperties = {
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '12px 14px', borderRadius: '10px', marginBottom: '8px',
      border: '1px solid var(--border)', cursor: answered ? 'default' : 'pointer',
      background: 'var(--tg-theme-secondary-bg-color, var(--bg))',
      transition: 'all 0.15s',
    };

    if (!answered) {
      if (selected === idx || multiSelected.includes(idx)) {
        base.borderColor = 'var(--primary)';
        base.background = 'var(--primary-light)';
      }
      return base;
    }

    const correctIds = question.correct_option_ids || [question.correct_option_id];
    const isCorrect = correctIds.includes(idx);
    const isChosen = selected === idx || multiSelected.includes(idx);

    if (isCorrect) {
      base.borderColor = 'var(--success)';
      base.background = 'rgba(34, 197, 94, 0.08)';
    } else if (isChosen && !isCorrect) {
      base.borderColor = 'var(--error)';
      base.background = 'rgba(239, 68, 68, 0.06)';
    }
    return base;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Progress */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>
          Вопрос {index + 1} / {total}
        </span>
        <div style={{ height: '4px', background: 'var(--border)', borderRadius: '2px', width: '120px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${((index + 1) / total) * 100}%`, background: 'var(--primary)', borderRadius: '2px' }} />
        </div>
      </div>

      {/* Question text */}
      <p style={{ fontSize: '16px', fontWeight: 600, lineHeight: 1.5, margin: 0 }}>{text}</p>

      {/* Answers */}
      {qType === 'true_false' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {['Верно', 'Неверно'].map((label, idx) => {
            const style = getOptionStyle(idx);
            return (
              <button key={label} onClick={() => handleTrueFalse(idx === 0)} style={{ ...style, justifyContent: 'center', fontWeight: 700 }}>
                <span style={{ fontSize: '18px' }}>{idx === 0 ? '✅' : '❌'}</span>
                {label}
              </button>
            );
          })}
        </div>
      ) : qType === 'multiple_choice' ? (
        <div>
          {question.options.map((opt, idx) => (
            <div key={idx} onClick={() => {
              if (answered) return;
              setMultiSelected((prev) =>
                prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
              );
            }} style={getOptionStyle(idx)}>
              <div style={{
                width: '18px', height: '18px', borderRadius: '4px', flexShrink: 0,
                border: `2px solid ${multiSelected.includes(idx) ? 'var(--primary)' : 'var(--border)'}`,
                background: multiSelected.includes(idx) ? 'var(--primary)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {multiSelected.includes(idx) && <span style={{ color: 'white', fontSize: '11px', fontWeight: 900 }}>✓</span>}
              </div>
              <span style={{ fontSize: '14px' }}>{opt}</span>
            </div>
          ))}
          {!answered && (
            <button
              onClick={handleMultiCheck}
              disabled={multiSelected.length === 0}
              style={{
                width: '100%', padding: '12px', marginTop: '8px',
                background: multiSelected.length ? 'var(--primary)' : 'var(--border)',
                color: multiSelected.length ? 'white' : 'var(--text-secondary)',
                border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '15px', cursor: 'pointer',
              }}
            >
              Проверить
            </button>
          )}
        </div>
      ) : (
        // single_choice
        question.options.map((opt, idx) => (
          <div key={idx} onClick={() => handleSingle(idx)} style={getOptionStyle(idx)}>
            <div style={{
              width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
              border: `2px solid ${answered
                ? (question.correct_option_id === idx ? 'var(--success)' : selected === idx ? 'var(--error)' : 'var(--border)')
                : selected === idx ? 'var(--primary)' : 'var(--border)'
              }`,
              background: !answered && selected === idx ? 'var(--primary)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {!answered && selected === idx && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'white' }} />}
              {answered && question.correct_option_id === idx && <CheckCircle2 size={12} color="var(--success)" />}
              {answered && selected === idx && question.correct_option_id !== idx && <XCircle size={12} color="var(--error)" />}
            </div>
            <span style={{ fontSize: '14px' }}>{opt}</span>
          </div>
        ))
      )}

      {/* Explanation */}
      {answered && question.explanation && (
        <div style={{
          display: 'flex', gap: '10px', alignItems: 'flex-start',
          padding: '12px 14px', borderRadius: '10px',
          background: 'rgba(108, 99, 255, 0.06)',
          border: '1px solid rgba(108, 99, 255, 0.2)',
        }}>
          <Info size={16} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.5, color: 'var(--text-secondary)' }}>{question.explanation}</p>
        </div>
      )}
    </div>
  );
};

export default QuestionCard;
