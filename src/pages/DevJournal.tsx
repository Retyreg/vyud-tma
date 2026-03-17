import { useState } from 'react';
import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ChevronLeft, PlusCircle, BookOpen, CheckCircle2, Circle, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';

const STORAGE_KEY = 'vyud_dev_journal';

interface RoadmapItem {
  id: string;
  phase: number;
  label: string;
}

interface JournalEntry {
  id: string;
  date: string;
  title: string;
  implemented: string;
  difficulties: string;
  completedItems: string[];
  createdAt: string;
}

const ROADMAP_ITEMS: RoadmapItem[] = [
  // Phase 1
  { id: 'p1_hmac', phase: 1, label: 'Валидация initData (HMAC-SHA256)' },
  { id: 'p1_secrets', phase: 1, label: 'Управление секретами (перенос API-ключей)' },
  { id: 'p1_rls', phase: 1, label: 'Row Level Security (RLS) в Supabase' },
  { id: 'p1_logging', phase: 1, label: 'Логирование (bot.log, streamlit.log, ai.log)' },
  { id: 'p1_ui_sync', phase: 1, label: 'Синхронизация UI с темой Telegram' },
  // Phase 2
  { id: 'p2_streaks', phase: 2, label: 'Механика Streaks (серии активности)' },
  { id: 'p2_reminders', phase: 2, label: 'Push-уведомления / Напоминания' },
  { id: 'p2_leaderboard', phase: 2, label: 'Таблица лидеров' },
  { id: 'p2_badges', phase: 2, label: 'Бейджи и достижения' },
  { id: 'p2_knowledge', phase: 2, label: 'Профилирование знаний (матрица компетенций)' },
  // Phase 3
  { id: 'p3_payment', phase: 3, label: 'Поток оплаты Telegram Stars (aiogram 3.x)' },
  { id: 'p3_fragment', phase: 3, label: 'Настройка Fragment-кошелька' },
  { id: 'p3_packages', phase: 3, label: 'Динамические пакеты кредитов' },
  // Phase 4
  { id: 'p4_pdf', phase: 4, label: 'Улучшение обработки PDF (таблицы, многоколоночность)' },
  { id: 'p4_whisper', phase: 4, label: 'Транскрипция Whisper + пост-обработка' },
  { id: 'p4_irt', phase: 4, label: 'Адаптивное обучение (IRT-формула)' },
  { id: 'p4_marketplace', phase: 4, label: 'Экспертный маркетплейс (70/30)' },
  // Phase 5
  { id: 'p5_roleplay', phase: 5, label: 'AI Role-play симуляции' },
  { id: 'p5_i18n', phase: 5, label: 'Мультиязычность (ru/en/es)' },
  { id: 'p5_pwa', phase: 5, label: 'PWA-версия Mini App' },
  { id: 'p5_scorm', phase: 5, label: 'Экспорт SCORM/xAPI' },
];

const PHASE_LABELS: Record<number, string> = {
  1: '🔐 Этап 1: Стабилизация',
  2: '🎮 Этап 2: Геймификация',
  3: '💰 Этап 3: Монетизация',
  4: '🧠 Этап 4: AI-масштабирование',
  5: '🔮 Этап 5: Инновации',
};

function loadEntries(): JournalEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveEntries(entries: JournalEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function getCompletedItemsAcrossAllEntries(entries: JournalEntry[]): Set<string> {
  const completed = new Set<string>();
  entries.forEach((e) => e.completedItems.forEach((id) => completed.add(id)));
  return completed;
}

const DevJournal: FC = () => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<JournalEntry[]>(() => loadEntries());
  const [showForm, setShowForm] = useState(false);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
  const [showRoadmap, setShowRoadmap] = useState(false);

  // Form state
  const [date, setDate] = useState(todayDate());
  const [title, setTitle] = useState('');
  const [implemented, setImplemented] = useState('');
  const [difficulties, setDifficulties] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const handleSave = () => {
    if (!implemented.trim() && !difficulties.trim() && selectedItems.length === 0) return;

    const newEntry: JournalEntry = {
      id: Date.now().toString(),
      date,
      title: title.trim() || `Запись от ${new Date(date).toLocaleDateString('ru-RU')}`,
      implemented: implemented.trim(),
      difficulties: difficulties.trim(),
      completedItems: selectedItems,
      createdAt: new Date().toISOString(),
    };

    const updated = [newEntry, ...entries];
    saveEntries(updated);
    setEntries(updated);

    setTitle('');
    setDate(todayDate());
    setImplemented('');
    setDifficulties('');
    setSelectedItems([]);
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    const updated = entries.filter((e) => e.id !== id);
    saveEntries(updated);
    setEntries(updated);
    if (expandedEntry === id) setExpandedEntry(null);
  };

  const toggleItem = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const allCompleted = getCompletedItemsAcrossAllEntries(entries);
  const totalItems = ROADMAP_ITEMS.length;
  const completedCount = allCompleted.size;
  const progressPct = Math.round((completedCount / totalItems) * 100);

  const phases = [1, 2, 3, 4, 5];

  const textareaStyle: React.CSSProperties = {
    width: '100%',
    minHeight: '80px',
    padding: '10px 12px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--color-border)',
    fontFamily: 'inherit',
    fontSize: '14px',
    backgroundColor: 'var(--color-background)',
    color: 'var(--color-text-primary)',
    resize: 'vertical',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 600,
    marginBottom: '6px',
    color: 'var(--color-text-primary)',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '8px',
            background: 'var(--color-surface)',
            borderRadius: '50%',
            border: '1px solid var(--color-border)',
            display: 'flex',
            cursor: 'pointer',
          }}
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 style={{ fontSize: '20px', margin: 0 }}>Дневник разработки</h1>
          <p className="text-muted" style={{ fontSize: '12px', margin: 0 }}>
            Фиксируй прогресс и трудности
          </p>
        </div>
      </div>

      {/* Roadmap progress summary */}
      <Card
        style={{ padding: '16px', cursor: 'pointer', userSelect: 'none' }}
        onClick={() => setShowRoadmap((v) => !v)}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontWeight: 600, fontSize: '15px' }}>🗺️ Прогресс по дорожной карте</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-primary)' }}>
              {completedCount}/{totalItems}
            </span>
            {showRoadmap ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>
        <div style={{ width: '100%', height: '8px', background: 'var(--color-border)', borderRadius: '4px', overflow: 'hidden' }}>
          <div
            style={{
              width: `${progressPct}%`,
              height: '100%',
              background: 'var(--color-primary)',
              transition: 'width 0.4s ease',
            }}
          />
        </div>
        <p className="text-muted" style={{ fontSize: '12px', margin: '6px 0 0 0' }}>
          {progressPct}% задач из дорожной карты выполнено
        </p>

        {showRoadmap && (
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {phases.map((phase) => {
              const items = ROADMAP_ITEMS.filter((i) => i.phase === phase);
              const done = items.filter((i) => allCompleted.has(i.id)).length;
              return (
                <div key={phase}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '13px',
                      fontWeight: 600,
                      marginBottom: '6px',
                    }}
                  >
                    <span>{PHASE_LABELS[phase]}</span>
                    <span className="text-muted">
                      {done}/{items.length}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {items.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '13px',
                          color: allCompleted.has(item.id)
                            ? 'var(--color-success)'
                            : 'var(--color-text-secondary)',
                        }}
                      >
                        {allCompleted.has(item.id) ? (
                          <CheckCircle2 size={14} color="var(--color-success)" />
                        ) : (
                          <Circle size={14} color="var(--color-border)" />
                        )}
                        {item.label}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Add entry button / form */}
      {!showForm ? (
        <Button onClick={() => setShowForm(true)} fullWidth>
          <PlusCircle size={18} style={{ marginRight: '8px' }} />
          Добавить запись
        </Button>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Новая запись</CardTitle>
            <CardDescription>Зафиксируй сегодняшний прогресс</CardDescription>
          </CardHeader>
          <CardContent style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Date */}
            <div>
              <label style={labelStyle}>Дата</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                  fontFamily: 'inherit',
                  fontSize: '14px',
                  backgroundColor: 'var(--color-background)',
                  color: 'var(--color-text-primary)',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Title */}
            <div>
              <label style={labelStyle}>Заголовок (необязательно)</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Например: Реализовал авторизацию Telegram"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                  fontFamily: 'inherit',
                  fontSize: '14px',
                  backgroundColor: 'var(--color-background)',
                  color: 'var(--color-text-primary)',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Implemented */}
            <div>
              <label style={labelStyle}>✅ Что было реализовано</label>
              <textarea
                style={textareaStyle}
                placeholder="Опиши, что удалось сделать сегодня..."
                value={implemented}
                onChange={(e) => setImplemented(e.target.value)}
              />
            </div>

            {/* Difficulties */}
            <div>
              <label style={labelStyle}>⚠️ С какими трудностями столкнулся</label>
              <textarea
                style={textareaStyle}
                placeholder="Опиши сложности, блокеры, нерешённые вопросы..."
                value={difficulties}
                onChange={(e) => setDifficulties(e.target.value)}
              />
            </div>

            {/* Roadmap items */}
            <div>
              <label style={labelStyle}>🗺️ Задачи из дорожной карты (отметь выполненные)</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
                {phases.map((phase) => (
                  <div key={phase}>
                    <p style={{ fontSize: '12px', fontWeight: 700, margin: '6px 0 4px 0', color: 'var(--color-text-secondary)' }}>
                      {PHASE_LABELS[phase]}
                    </p>
                    {ROADMAP_ITEMS.filter((i) => i.phase === phase).map((item) => {
                      const alreadyDone = allCompleted.has(item.id) && !selectedItems.includes(item.id);
                      return (
                        <label
                          key={item.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '13px',
                            padding: '4px 0',
                            cursor: alreadyDone ? 'default' : 'pointer',
                            color: alreadyDone ? 'var(--color-text-secondary)' : 'var(--color-text-primary)',
                            opacity: alreadyDone ? 0.6 : 1,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(item.id)}
                            disabled={alreadyDone}
                            onChange={() => toggleItem(item.id)}
                            style={{ accentColor: 'var(--color-primary)', width: '16px', height: '16px' }}
                          />
                          {item.label}
                          {alreadyDone && (
                            <span style={{ fontSize: '11px', color: 'var(--color-success)' }}>(уже выполнено)</span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <Button onClick={handleSave} fullWidth>
                Сохранить
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setTitle('');
                  setDate(todayDate());
                  setImplemented('');
                  setDifficulties('');
                  setSelectedItems([]);
                }}
                fullWidth
              >
                Отмена
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Entries list */}
      <div>
        <h2 style={{ fontSize: '16px', marginBottom: '10px', marginTop: '4px' }}>
          <BookOpen size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
          История записей
        </h2>

        {entries.length === 0 ? (
          <p className="text-muted" style={{ textAlign: 'center', padding: '24px 0', fontSize: '14px' }}>
            Записей пока нет. Добавьте первую!
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {entries.map((entry) => (
              <Card key={entry.id} style={{ padding: '14px' }}>
                {/* Entry header */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    cursor: 'pointer',
                  }}
                  onClick={() => setExpandedEntry(expandedEntry === entry.id ? null : entry.id)}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: '0 0 2px 0', fontSize: '15px', fontWeight: 600 }}>
                      {entry.title}
                    </p>
                    <p className="text-muted" style={{ margin: 0, fontSize: '12px' }}>
                      {new Date(entry.date).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                      {entry.completedItems.length > 0 && (
                        <span
                          style={{
                            marginLeft: '8px',
                            background: 'var(--color-primary-light)',
                            color: 'var(--color-primary)',
                            padding: '1px 6px',
                            borderRadius: '10px',
                            fontSize: '11px',
                            fontWeight: 600,
                          }}
                        >
                          +{entry.completedItems.length} задач
                        </span>
                      )}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(entry.id);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                      }}
                    >
                      <Trash2 size={15} color="var(--color-text-secondary)" />
                    </button>
                    {expandedEntry === entry.id ? (
                      <ChevronUp size={18} color="var(--color-text-secondary)" />
                    ) : (
                      <ChevronDown size={18} color="var(--color-text-secondary)" />
                    )}
                  </div>
                </div>

                {/* Expanded content */}
                {expandedEntry === entry.id && (
                  <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {entry.implemented && (
                      <div>
                        <p style={{ fontSize: '12px', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--color-success)' }}>
                          ✅ Реализовано
                        </p>
                        <p style={{ fontSize: '13px', margin: 0, whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                          {entry.implemented}
                        </p>
                      </div>
                    )}
                    {entry.difficulties && (
                      <div>
                        <p style={{ fontSize: '12px', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--color-danger)' }}>
                          ⚠️ Трудности
                        </p>
                        <p style={{ fontSize: '13px', margin: 0, whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                          {entry.difficulties}
                        </p>
                      </div>
                    )}
                    {entry.completedItems.length > 0 && (
                      <div>
                        <p style={{ fontSize: '12px', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--color-primary)' }}>
                          🗺️ Задачи из дорожной карты
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {entry.completedItems.map((itemId) => {
                            const item = ROADMAP_ITEMS.find((r) => r.id === itemId);
                            return item ? (
                              <div
                                key={itemId}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  fontSize: '13px',
                                  color: 'var(--color-success)',
                                }}
                              >
                                <CheckCircle2 size={13} />
                                {item.label}
                              </div>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DevJournal;
