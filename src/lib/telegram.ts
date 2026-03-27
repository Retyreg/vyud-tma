export const tg = typeof window !== 'undefined' ? (window as any).Telegram?.WebApp : undefined;

export const isTMA = (): boolean => {
  return Boolean(tg?.initDataUnsafe?.user?.id);
};

export const getTelegramUser = () => {
  return tg?.initDataUnsafe?.user ?? null;
};

export const initTelegram = () => {
  if (tg) {
    try { tg.ready(); } catch (_) {}
    try { tg.expand(); } catch (_) {}
  }
};

export const getTelegramEmail = (): string => {
  const user = getTelegramUser();
  if (!user) return '';
  return `${user.username || `user${user.id}`}@telegram.io`;
};
