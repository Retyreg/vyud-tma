/**
 * Auth helpers for backend requests from Telegram Mini App.
 *
 * Attach getAuthHeaders() to every fetch/axios call that hits the backend.
 * The backend verifies X-Init-Data via HMAC-SHA256 (Telegram WebApp spec).
 */

const getTg = (): any =>
  typeof window !== 'undefined' ? (window as any).Telegram?.WebApp : undefined;

/**
 * Returns headers required for authenticated backend requests.
 * X-Init-Data is the signed Telegram WebApp initData string.
 */
export function getAuthHeaders(): Record<string, string> {
  const initData = getTg()?.initData ?? '';
  return {
    'X-Init-Data': initData,
    'Content-Type': 'application/json',
  };
}

/**
 * Returns auth headers for multipart/form-data requests (no Content-Type override).
 * Browser sets the correct boundary automatically when body is FormData.
 */
export function getAuthHeadersMultipart(): Record<string, string> {
  const initData = getTg()?.initData ?? '';
  return {
    'X-Init-Data': initData,
  };
}
