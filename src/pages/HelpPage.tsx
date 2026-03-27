import type { FC } from 'react';

const STEPS = [
  {
    emoji: '📁',
    title: 'Загрузите файл',
    desc: 'Выберите PDF-лекцию, DOCX-документ, аудио MP3 или видео MP4 — до 20 МБ',
  },
  {
    emoji: '⚡',
    title: 'AI создаёт тест',
    desc: 'Наш AI анализирует содержимое и генерирует до 20 вопросов за 30 секунд',
  },
  {
    emoji: '🎯',
    title: 'Проходите и учитесь',
    desc: 'Отвечайте на вопросы, получайте объяснения и отслеживайте прогресс',
  },
];

const FORMATS = [
  { fmt: 'PDF', desc: 'Учебники, лекции, статьи', emoji: '📄' },
  { fmt: 'DOCX', desc: 'Документы Word', emoji: '📝' },
  { fmt: 'PPTX', desc: 'Презентации PowerPoint', emoji: '📊' },
  { fmt: 'TXT', desc: 'Текстовые файлы', emoji: '📃' },
  { fmt: 'MP3 / WAV', desc: 'Аудиолекции и подкасты', emoji: '🎵' },
  { fmt: 'MP4', desc: 'Видеоуроки', emoji: '🎬' },
];

const HelpPage: FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
    <div>
      <h1 style={{ fontSize: '22px', margin: '0 0 4px' }}>Как пользоваться</h1>
      <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>VYUD AI — за 30 секунд из файла в тест</p>
    </div>

    {/* Steps */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {STEPS.map((s, i) => (
        <div key={i} style={{
          display: 'flex', gap: '14px', padding: '16px',
          borderRadius: '12px', background: 'var(--tg-theme-secondary-bg-color, var(--card))',
          border: '1px solid var(--border)',
        }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '50%',
            background: 'var(--primary-light)', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '22px',
          }}>
            {s.emoji}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontWeight: 800, fontSize: '13px', color: 'var(--primary)' }}>Шаг {i + 1}</span>
              <h3 style={{ margin: 0, fontSize: '15px' }}>{s.title}</h3>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{s.desc}</p>
          </div>
        </div>
      ))}
    </div>

    {/* Formats */}
    <div>
      <h2 style={{ fontSize: '17px', margin: '0 0 12px' }}>Поддерживаемые форматы</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {FORMATS.map((f) => (
          <div key={f.fmt} style={{
            padding: '12px', borderRadius: '10px',
            background: 'var(--tg-theme-secondary-bg-color, var(--card))',
            border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: '10px',
          }}>
            <span style={{ fontSize: '22px' }}>{f.emoji}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '13px' }}>{f.fmt}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{f.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Bot link */}
    <div style={{
      padding: '20px', borderRadius: '16px', textAlign: 'center',
      background: 'linear-gradient(135deg, var(--primary-light) 0%, #ede9fe 100%)',
      border: '1px solid var(--primary)',
    }}>
      <div style={{ fontSize: '36px', marginBottom: '10px' }}>🤖</div>
      <h3 style={{ margin: '0 0 6px', fontSize: '16px' }}>Telegram-бот</h3>
      <p style={{ margin: '0 0 14px', fontSize: '13px', color: 'var(--text-secondary)' }}>
        Отправьте файл прямо в чат боту — он пришлёт тест в виде викторины
      </p>
      <a
        href="https://t.me/VyudAiBot"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-block', padding: '10px 24px', borderRadius: '20px',
          background: 'var(--primary)', color: 'white', fontWeight: 700, fontSize: '14px',
          textDecoration: 'none',
        }}
      >
        Открыть @VyudAiBot
      </a>
    </div>
  </div>
);

export default HelpPage;
