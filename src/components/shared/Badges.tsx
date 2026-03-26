import type { FC } from 'react';
import { Card } from '../ui/Card';
import type { UserProfile } from '../../hooks/useSupabaseData';

interface Badge {
  id: string;
  icon: string;
  title: string;
  description: string;
  unlocked: (p: UserProfile) => boolean;
}

const BADGES: Badge[] = [
  {
    id: 'first_step',
    icon: '⚡',
    title: 'Первый шаг',
    description: 'Создай свой первый курс',
    unlocked: (p) => p.total_generations >= 1,
  },
  {
    id: 'student',
    icon: '📚',
    title: 'Студент',
    description: '5 созданных курсов',
    unlocked: (p) => p.total_generations >= 5,
  },
  {
    id: 'scholar',
    icon: '🎓',
    title: 'Учёный',
    description: '20 созданных курсов',
    unlocked: (p) => p.total_generations >= 20,
  },
  {
    id: 'streak_3',
    icon: '🔥',
    title: 'На огне',
    description: 'Серия 3 дня подряд',
    unlocked: (p) => p.current_streak >= 3,
  },
  {
    id: 'streak_7',
    icon: '💫',
    title: 'Неделя знаний',
    description: 'Серия 7 дней подряд',
    unlocked: (p) => p.current_streak >= 7,
  },
  {
    id: 'streak_30',
    icon: '🚀',
    title: 'Мастер',
    description: 'Серия 30 дней подряд',
    unlocked: (p) => p.current_streak >= 30,
  },
  {
    id: 'rich',
    icon: '💎',
    title: 'Богатый опыт',
    description: 'Накопи 100+ кредитов',
    unlocked: (p) => p.credits >= 100,
  },
];

interface BadgesProps {
  profile: UserProfile;
}

const Badges: FC<BadgesProps> = ({ profile }) => {
  const unlockedCount = BADGES.filter((b) => b.unlocked(profile)).length;

  return (
    <Card style={{ padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <h2 style={{ fontSize: '16px', margin: 0 }}>Достижения</h2>
        <span style={{ fontSize: '12px', color: 'var(--tg-theme-hint-color)', background: 'var(--tg-theme-bg-color)', padding: '2px 8px', borderRadius: '12px' }}>
          {unlockedCount}/{BADGES.length}
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
        {BADGES.map((badge) => {
          const isUnlocked = badge.unlocked(profile);
          return (
            <div
              key={badge.id}
              title={`${badge.title}: ${badge.description}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                padding: '8px 4px',
                borderRadius: 'var(--radius-sm)',
                background: isUnlocked ? 'rgba(79, 70, 229, 0.08)' : 'var(--tg-theme-bg-color)',
                border: isUnlocked ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                opacity: isUnlocked ? 1 : 0.4,
                transition: 'all 0.2s',
              }}
            >
              <span style={{ fontSize: '22px', filter: isUnlocked ? 'none' : 'grayscale(1)' }}>
                {badge.icon}
              </span>
              <span style={{ fontSize: '10px', textAlign: 'center', fontWeight: 600, lineHeight: 1.2, color: isUnlocked ? 'var(--tg-theme-text-color)' : 'var(--tg-theme-hint-color)' }}>
                {badge.title}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default Badges;
