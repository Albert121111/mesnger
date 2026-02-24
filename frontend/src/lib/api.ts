import axios from 'axios';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  timeout: 15000
});

export function getUserFriendlyError(error: unknown): string {
  if (!axios.isAxiosError(error)) return 'Неизвестная ошибка. Попробуйте снова.';

  const status = error.response?.status;
  const message = String(error.response?.data?.message || '');

  if (status === 401) return 'Неверный логин или пароль.';
  if (status === 409) return 'Username или email уже заняты.';
  if (status === 400 && message) return message;

  const combined = `${error.code || ''} ${error.message || ''} ${message}`.toLowerCase();
  if (combined.includes('cors')) return 'Ошибка доступа (CORS).';

  if (
    error.code === 'ERR_NETWORK' ||
    combined.includes('network error') ||
    combined.includes('failed to fetch') ||
    combined.includes('econnrefused') ||
    !error.response
  ) {
    return 'Сервер недоступен. Проверьте, запущен ли backend.';
  }

  return message || 'Произошла ошибка запроса.';
}

if (process.env.NODE_ENV !== 'production') {
  api.interceptors.request.use((config) => {
    console.info('[API REQUEST]', { method: config.method, baseURL: config.baseURL, url: config.url });
    return config;
  });

  api.interceptors.response.use(
    (response) => response,
    (error) => {
      console.error('[API ERROR]', {
        url: error?.config?.url,
        method: error?.config?.method,
        baseURL: error?.config?.baseURL,
        status: error?.response?.status,
        data: error?.response?.data,
        code: error?.code,
        message: error?.message
      });
      return Promise.reject(error);
    }
  );
}
