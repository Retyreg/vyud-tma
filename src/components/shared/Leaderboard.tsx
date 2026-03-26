import type { FC } from 'react';
import { Card } from '../ui/Card';
import { Zap } from 'lucide-react';
import type { LeaderboardEntry } from '../../hooks/useSupabaseData';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  currentUsername: string | undefined;
}

const MEDALS = ['🥇', '🥈', '🥉'];

const Leaderboard: FC<LeaderboardProps> = ({ entries, currentUsername }) => {
  if (entries.length === 0) return null;

  return (
    <Card style={{ padding: '16px' }}>
      <h2 style={{ fontSize: '16px', margin: '0 0 14px 0' }}>🏆 Таблица лидеров</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {entries.map((entry, index) => {
          const isCurrentUser = entry.username && entry.username === currentUsername;
          const displayName = entry.username ? `@${entry.username}` : `Пользователь ${index + 1}`;

          return (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 10px',
                borderRadius: 'var(--radius-sm)',
                background: isCurrentUser ? 'rgba(79, 70, 229, 0.08)' : 'var(--tg-theme-bg-color)',
                border: isCurrentUser ? '1px solid var(--color-primary)' : '1px solid transparent',
              }}
            >
              <span style={{ fontSize: '18px', width: '24px', textAlign: 'center', flexShrink: 0 }}>
                {index < 3 ? MEDALS[index] : `${index + 1}`}
              </span>
              <span
                style={{
                  flex: 1,
                  fontSize: '13px',
                  fontWeight: isCurrentUser ? 700 : 400,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  color: isCurrentUser ? 'var(--color-primary)' : 'var(--tg-theme-text-color)',
                }}
              >
                {displayName}
                {isCurrentUser && ' (ты)'}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                <Zap size={13} color="var(--color-primary)" />
                <span style={{ fontSize: '13px', fontWeight: 600 }}>{entry.credits}</span>
              </div>
              {entry.current_streak > 0 && (
                <span style={{ fontSize: '12px', color: 'var(--tg-theme-hint-color)', flexShrink: 0 }}>
                  🔥{entry.current_streak}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default Leaderboard;
