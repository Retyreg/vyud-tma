// Always read from window at call time — never cache at module load,
// because window.Telegram.WebApp may not exist yet when the module first loads.

const getTg = () => (typeof window !== 'undefined' ? (window as any).Telegram?.WebApp : undefined);

export const isTMA = (): boolean => {
  return Boolean(getTg()?.initDataUnsafe?.user?.id);
};

export const getTelegramUser = () => {
  return getTg()?.initDataUnsafe?.user ?? null;
};

export const initTelegram = () => {
  const tg = getTg();
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

export const applyTelegramTheme = () => {
  try {
    const tg = getTg();
    const params = tg?.themeParams;
    if (!params) return;
    const root = document.documentElement;
    const map: Record<string, string> = {
      bg_color: '--tg-theme-bg-color',
      text_color: '--tg-theme-text-color',
      hint_color: '--tg-theme-hint-color',
      link_color: '--tg-theme-link-color',
      button_color: '--tg-theme-button-color',
      button_text_color: '--tg-theme-button-text-color',
      secondary_bg_color: '--tg-theme-secondary-bg-color',
      header_bg_color: '--tg-theme-header-bg-color',
    };
    for (const [key, cssVar] of Object.entries(map)) {
      const value = (params as Record<string, string | undefined>)[key];
      if (value) root.style.setProperty(cssVar, value);
    }
  } catch (_) {}
};
