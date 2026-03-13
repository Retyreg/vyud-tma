import React from 'react';
import { createRoot } from 'react-dom/client';
import WebApp from '@twa-dev/sdk';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './styles/global.css';

// Безопасная инициализация Telegram SDK
try {
  // Проверяем, что методы существуют (они могут отсутствовать в обычном браузере)
  if (WebApp && typeof WebApp.ready === 'function') {
    WebApp.ready();
  }
  if (WebApp && typeof WebApp.expand === 'function') {
    WebApp.expand();
  }
} catch (e) {
  console.warn("Telegram WebApp SDK is not available in this environment", e);
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>,
  );
}
