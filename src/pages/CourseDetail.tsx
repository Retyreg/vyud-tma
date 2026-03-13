import { useEffect, useState } from 'react';
import type { FC } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ChevronLeft, CheckCircle2, XCircle, Info, Trophy } from 'lucide-react';
import WebApp from '@twa-dev/sdk';

interface Question {
  scenario: string;
  options: string[];
  correct_option_id: number;
  explanation: string;
  question_type: string;
}

const CourseDetail: FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);

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

  const handleOptionSelect = (questionIndex: number, optionIndex: number) => {
    if (showResults) return;
    setAnswers({ ...answers, [questionIndex]: optionIndex });
    triggerHaptic('light');
  };

  const calculateScore = () => {
    let score = 0;
    quiz.questions.forEach((q: Question, index: number) => {
      if (answers[index] === q.correct_option_id) score++;
    });
    return score;
  };

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Загрузка теста...</div>;
  if (!quiz) return <div style={{ padding: '20px', textAlign: 'center' }}>Тест не найден.</div>;

  const score = calculateScore();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button onClick={() => navigate('/')} style={{ padding: '8px', background: 'var(--color-surface)', borderRadius: '50%', border: '1px solid var(--color-border)', display: 'flex' }}>
          <ChevronLeft size={20} />
        </button>
        <h1 style={{ fontSize: '20px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{quiz.title}</h1>
      </div>

      {quiz.questions.map((q: Question, qIndex: number) => (
        <Card key={qIndex} style={{ 
          border: showResults 
            ? (answers[qIndex] === q.correct_option_id ? '2px solid var(--color-success)' : '2px solid var(--color-danger)')
            : '1px solid var(--color-border)'
        }}>
          <CardHeader>
            <CardTitle style={{ fontSize: '16px' }}>{qIndex + 1}. {q.scenario}</CardTitle>
          </CardHeader>
          <CardContent style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {q.options.map((option, oIndex) => {
              const isSelected = answers[qIndex] === oIndex;
              const isCorrect = q.correct_option_id === oIndex;
              
              let bgColor = 'var(--color-surface)';
              let borderColor = 'var(--color-border)';
              
              if (isSelected) {
                bgColor = 'var(--color-primary-light)';
                borderColor = 'var(--color-primary)';
              }
              
              if (showResults) {
                if (isCorrect) {
                  bgColor = '#d1fae5';
                  borderColor = 'var(--color-success)';
                } else if (isSelected && !isCorrect) {
                  bgColor = '#fee2e2';
                  borderColor = 'var(--color-danger)';
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
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s'
                  }}
                >
                  <span>{option}</span>
                  {showResults && isCorrect && <CheckCircle2 size={18} color="var(--color-success)" />}
                  {showResults && isSelected && !isCorrect && <XCircle size={18} color="var(--color-danger)" />}
                </button>
              );
            })}

            {showResults && q.explanation && (
              <div style={{ marginTop: '10px', padding: '12px', background: 'var(--color-background)', borderRadius: 'var(--radius-sm)', display: 'flex', gap: '8px' }}>
                <Info size={16} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <p style={{ fontSize: '13px', fontStyle: 'italic' }}>{q.explanation}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {!showResults ? (
        <Button 
          fullWidth 
          size="lg" 
          disabled={Object.keys(answers).length < quiz.questions.length}
          onClick={() => {
            setShowResults(true);
            triggerHaptic('success');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          Проверить результаты
        </Button>
      ) : (
        <Card style={{ background: 'var(--color-primary)', color: 'white', textAlign: 'center' }}>
          <CardContent style={{ padding: '20px' }}>
            <Trophy size={40} style={{ marginBottom: '10px' }} />
            <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>Ваш результат: {score} / {quiz.questions.length}</h2>
            <p style={{ opacity: 0.9, marginBottom: '20px' }}>
              {score === quiz.questions.length ? 'Идеально! Вы настоящий эксперт.' : 'Хороший результат! Попробуйте еще раз.'}
            </p>
            <Button style={{ backgroundColor: 'white', color: 'var(--color-primary)' }} fullWidth onClick={() => navigate('/')}>
              Вернуться на главную
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CourseDetail;
