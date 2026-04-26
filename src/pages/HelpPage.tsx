import type { FC } from 'react';

const MANAGER_STEPS = [
  { emoji: '📄', title: 'Загрузите PDF-регламент', desc: 'Перейдите в Дашборд → кнопка «PDF». AI автоматически разобьёт документ на шаги и создаст квиз.' },
  { emoji: '👥', title: 'Пригласите команду', desc: 'Скопируйте инвайт-ссылку в Дашборде и поделитесь с сотрудниками.' },
  { emoji: '📊', title: 'Следите за прогрессом', desc: 'В Дашборде видно кто прошёл каждый регламент и с каким результатом.' },
];

const EMPLOYEE_STEPS = [
  { emoji: '📋', title: 'Выберите регламент', desc: 'На главном экране нажмите на регламент, который нужно пройти.' },
  { emoji: '📖', title: 'Прочитайте шаги', desc: 'Листайте шаги регламента и узнавайте правила работы.' },
  { emoji: '✅', title: 'Сдайте квиз', desc: 'После шагов ответьте на вопросы и получите сертификат.' },
];

const FAQ = [
  { q: 'Как добавить регламент?', a: 'Менеджер может загрузить PDF (кнопка «📄 PDF» в Дашборде) или добавить из библиотеки шаблонов.' },
  { q: 'Как пригласить сотрудников?', a: 'В Дашборде нажмите «Копировать» — скопируется ссылка на вступление в вашу команду.' },
  { q: 'Что такое черновик?', a: 'Черновой регламент виден только менеджеру. Опубликуйте его, чтобы сотрудники увидели.' },
  { q: 'Как получить сертификат?', a: 'После прохождения квиза на сертификат появится кнопка в разделе «Прогресс».' },
  { q: 'Что такое серия (🔥)?', a: 'Количество дней подряд, в которые вы проходили регламенты. Старайтесь не прерывать серию!' },
  { q: 'Можно ли редактировать регламент?', a: 'Да. Менеджер может редактировать шаги через иконку ✏️ в Дашборде.' },
];

const HelpPage: FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
    <div>
      <h1 style={{ fontSize: 22, margin: '0 0 4px' }}>Как пользоваться</h1>
      <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14 }}>VYUD Frontline — корпоративные регламенты в Telegram</p>
    </div>

    {/* Manager steps */}
    <div>
      <h2 style={{ fontSize: 15, margin: '0 0 10px', fontWeight: 700 }}>👑 Для менеджера</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {MANAGER_STEPS.map((s, i) => (
          <div key={i} style={{
            display: 'flex', gap: 14, padding: 14,
            borderRadius: 12, background: 'var(--tg-theme-secondary-bg-color, var(--card))',
            border: '1px solid var(--border)',
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
              background: 'var(--primary-light)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
            }}>
              {s.emoji}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3 }}>{s.title}</div>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Employee steps */}
    <div>
      <h2 style={{ fontSize: 15, margin: '0 0 10px', fontWeight: 700 }}>👤 Для сотрудника</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {EMPLOYEE_STEPS.map((s, i) => (
          <div key={i} style={{
            display: 'flex', gap: 14, padding: 14,
            borderRadius: 12, background: 'var(--tg-theme-secondary-bg-color, var(--card))',
            border: '1px solid var(--border)',
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
              background: '#f0fdf4',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
            }}>
              {s.emoji}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3 }}>{s.title}</div>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* FAQ */}
    <div>
      <h2 style={{ fontSize: 15, margin: '0 0 10px', fontWeight: 700 }}>Частые вопросы</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {FAQ.map((item, i) => (
          <div key={i} style={{
            padding: '12px 14px', borderRadius: 12,
            background: 'var(--tg-theme-secondary-bg-color, var(--card))',
            border: '1px solid var(--border)',
          }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
              {item.q}
            </div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {item.a}
            </p>
          </div>
        ))}
      </div>
    </div>

    {/* Support */}
    <div style={{
      padding: 18, borderRadius: 14, textAlign: 'center',
      background: 'linear-gradient(135deg, var(--primary-light) 0%, #ede9fe 100%)',
      border: '1px solid var(--primary)',
    }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
      <h3 style={{ margin: '0 0 4px', fontSize: 15 }}>Нужна помощь?</h3>
      <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--text-secondary)' }}>
        Напишите нам в Telegram — ответим в течение часа
      </p>
      <a
        href="https://t.me/VyudAI"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-block', padding: '10px 24px', borderRadius: 20,
          background: 'var(--primary)', color: 'white', fontWeight: 700, fontSize: 14,
          textDecoration: 'none',
        }}
      >
        Написать в поддержку
      </a>
    </div>
  </div>
);

export default HelpPage;
