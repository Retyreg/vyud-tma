import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';

// Apply Telegram theme CSS variables if running inside TMA
function applyTelegramTheme() {
  try {
    const tg = (window as any).Telegram?.WebApp;
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
      const value = (params as unknown as Record<string, string | undefined>)[key];
      if (value) root.style.setProperty(cssVar, value);
    }
  } catch (_) {}
}

try {
  const tg = (window as any).Telegram?.WebApp;
  if (tg) {
    tg.ready?.();
    tg.expand?.();
    applyTelegramTheme();
    tg.onEvent?.('themeChanged', applyTelegramTheme);
  }
} catch (_) {}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}
