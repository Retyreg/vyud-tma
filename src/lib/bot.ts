// Frontline bot username — used in invite links, support links, and the manager dashboard.
// Configured per environment via VITE_TMA_BOT_USERNAME, falls back to 'VyudFrontlineBot'.
export const BOT_USERNAME = (import.meta.env.VITE_TMA_BOT_USERNAME as string | undefined) || 'VyudFrontlineBot';
