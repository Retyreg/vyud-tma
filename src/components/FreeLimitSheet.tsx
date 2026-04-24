import type { FC } from 'react';

interface Props {
  onClose: () => void;
}

const FreeLimitSheet: FC<Props> = ({ onClose }) => (
  <div
    style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'flex-end',
    }}
    onClick={onClose}
  >
    <div
      style={{
        width: '100%', background: 'var(--tg-theme-bg-color, #fff)',
        borderRadius: '20px 20px 0 0', padding: '24px 20px 32px',
        display: 'flex', flexDirection: 'column', gap: 16,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--border)', margin: '0 auto' }} />

      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>🚀</div>
        <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 8px', color: 'var(--text)' }}>
          Лимит бесплатного плана
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
          Бесплатный план: <strong>1 регламент</strong> и <strong>5 сотрудников</strong>.
          <br />
          Обновите план, чтобы добавлять больше.
        </p>
      </div>

      <button
        onClick={() => {
          if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.openLink) {
            (window as any).Telegram.WebApp.openLink('https://vyud.online/pricing');
          } else {
            window.open('https://vyud.online/pricing', '_blank');
          }
        }}
        style={{
          width: '100%', padding: '14px', borderRadius: 12,
          background: '#4F46E5', color: 'white',
          border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 16,
        }}
      >
        Узнать цены
      </button>

      <button
        onClick={onClose}
        style={{
          width: '100%', padding: '12px', borderRadius: 12,
          background: 'var(--tg-theme-secondary-bg-color, #f3f4f6)', color: 'var(--text)',
          border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 15,
        }}
      >
        Закрыть
      </button>
    </div>
  </div>
);

export default FreeLimitSheet;
