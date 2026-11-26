import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

let accessToken: string | null = null;
let refreshPromise: Promise<string> | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

const AUTH_SKIP_REFRESH_PATHS = [
  '/auth/login',
  '/auth/refresh',
  '/auth/definir-senha',
];

export function shouldSkipAuthRefresh(url?: string): boolean {
  if (!url) return false;
  return AUTH_SKIP_REFRESH_PATHS.some((path) => url.includes(path));
}

export function extractApiErrorMessage(
  err: unknown,
  fallback = 'Ocorreu um erro inesperado. Tente novamente.'
): string {
  const axiosErr = err as AxiosError<{
    error?: string | { message?: string };
    message?: string;
    detalhes?: Array<{ campo?: string; mensagem?: string }>;
  }>;

  if (axiosErr?.code === 'ECONNABORTED') {
    return 'Tempo limite da requisição esgotado. Tente novamente.';
  }

  const data = axiosErr?.response?.data;
  if (data) {
    const firstDetail = Array.isArray(data.detalhes)
      ? data.detalhes[0]?.mensagem
      : undefined;
    if (firstDetail) return firstDetail;
    if (typeof data.error === 'string' && data.error.trim()) {
      return data.error;
    }
    if (
      typeof data.error === 'object' &&
      data.error !== null &&
      typeof data.error.message === 'string' &&
      data.error.message.trim()
    ) {
      return data.error.message;
    }
    if (typeof data.message === 'string' && data.message.trim()) {
      return data.message;
    }
  }

  if (axiosErr?.isAxiosError && !axiosErr.response) {
    return 'Não foi possível conectar ao servidor. Verifique sua conexão.';
  }

  if (err instanceof Error && err.message && !axiosErr?.isAxiosError) {
    return err.message;
  }

  return fallback;
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  withCredentials: true,
  timeout: 15000,
});

// Request interceptor: attach access token from memory
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

async function performTokenRefresh(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = axios
      .post<{ accessToken: string }>(
        '/api/auth/refresh',
        {},
        { withCredentials: true }
      )
      .then(({ data }) => {
        setAccessToken(data.accessToken);
        return data.accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

// Response interceptor: auto-refresh on 401 (excluding auth endpoints themselves)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error?.config as RetryableConfig | undefined;

    if (
      error?.response?.status === 401 &&
      original &&
      !original._retry &&
      !shouldSkipAuthRefresh(original.url)
    ) {
      original._retry = true;

      try {
        const newToken = await performTokenRefresh();
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (refreshError) {
        setAccessToken(null);
        if (typeof window !== 'undefined') {
          const path = window.location.pathname;
          if (!path.startsWith('/login') && !path.startsWith('/reset-password')) {
            window.location.href = '/login';
          }
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
