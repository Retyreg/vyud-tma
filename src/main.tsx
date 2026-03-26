import { createRoot } from 'react-dom/client';
import WebApp from '@twa-dev/sdk';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './styles/global.css';

// Применяет параметры темы Telegram как CSS-переменные на :root
function applyTelegramTheme() {
  try {
    const params = WebApp?.themeParams;
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
      accent_text_color: '--tg-theme-accent-text-color',
      destructive_text_color: '--tg-theme-destructive-text-color',
    };

    for (const [key, cssVar] of Object.entries(map)) {
      const value = (params as unknown as Record<string, string | undefined>)[key];
      if (value) root.style.setProperty(cssVar, value);
    }
  } catch (e) {
    console.warn('Failed to apply Telegram theme params', e);
  }
}

// Безопасная инициализация Telegram SDK
try {
  if (WebApp && typeof WebApp.ready === 'function') {
    WebApp.ready();
  }
  if (WebApp && typeof WebApp.expand === 'function') {
    WebApp.expand();
  }
  applyTelegramTheme();
  WebApp.onEvent('themeChanged', applyTelegramTheme);
} catch (e) {
  console.warn("Telegram WebApp SDK is not available in this environment", e);
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}
