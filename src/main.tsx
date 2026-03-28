import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { initTelegram, applyTelegramTheme } from './lib/telegram.ts';

// Initialize Telegram SDK and apply theme if running inside TMA
initTelegram();
applyTelegramTheme();

try {
  const tg = (window as any).Telegram?.WebApp;
  if (tg?.onEvent) {
    tg.onEvent('themeChanged', applyTelegramTheme);
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
