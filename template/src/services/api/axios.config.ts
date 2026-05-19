import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_URL, ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from '../../environment';
import { extractApiError } from './error.utils';
import i18n from '../../i18n/i18n';

/**
 * Fires a global notification event that UI components can listen to.
 * Used for errors that happen outside a form context (e.g. background fetches).
 */
const emitGlobalError = (msg: string) => {
  window.dispatchEvent(new CustomEvent('app:api-error', { detail: { message: msg } }));
};

// ─── Refresh mutex ─────────────────────────────────────────────────────────────
// Prevents multiple simultaneous token-refresh calls when several requests
// arrive with a 401 at the same time (race condition).
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

const onTokenRefreshed = (newToken: string) => {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
};

const onRefreshFailed = () => {
  refreshSubscribers = [];
};

const doRefresh = async (): Promise<string> => {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) throw new Error('No refresh token');

  const response = await axios.post(`${API_URL}/auth/refresh-token`, { refreshToken });
  const data = response.data?.data || response.data;
  const { accessToken, refreshToken: newRefreshToken } = data;

  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
  return accessToken;
};

const clearAuthAndRedirect = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem('user');
  window.location.href = '/login';
};

// ─── Main API instance ─────────────────────────────────────────────────────────

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.headers) {
      config.headers['Accept-Language'] = i18n.language || 'en';
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    // Unwrap backend ApiResponse { success, message, data }
    if (
      response.data &&
      typeof response.data === 'object' &&
      'success' in response.data &&
      'data' in response.data
    ) {
      response.data = response.data.data;
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status !== 401 || originalRequest._retry) {
      // Emit a global notification for server / network errors.
      // Auth forms handle their own 4xx errors inline; only broadcast unexpected failures.
      const status = error.response?.status;
      if (!status || status >= 500 || error.code === 'ECONNABORTED' || !error.response) {
        emitGlobalError(extractApiError(error));
      }
      return Promise.reject(error);
    }

    // If there is no stored access token this is an unauthenticated request
    // (e.g. login, register). Skip token refresh — just propagate the 401 so
    // the component can show "Invalid email or password".
    const storedToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!storedToken) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Another refresh is already in flight — queue this request
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh((newToken) => {
          originalRequest._retry = true;
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          resolve(api(originalRequest));
        });
        // Also handle the case where refresh ultimately fails
        const unsub = () => reject(new Error('Token refresh failed'));
        refreshSubscribers.push(unsub as never);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const newToken = await doRefresh();
      isRefreshing = false;
      onTokenRefreshed(newToken);

      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
      }
      return api(originalRequest);
    } catch (refreshError) {
      isRefreshing = false;
      onRefreshFailed();
      clearAuthAndRedirect();
      return Promise.reject(refreshError);
    }
  }
);

export default api;

// ─── Multipart (file upload) instance ─────────────────────────────────────────

export const apiMultipart = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'multipart/form-data' },
  timeout: 60000,
});

apiMultipart.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.headers) {
      config.headers['Accept-Language'] = i18n.language || 'en';
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

apiMultipart.interceptors.response.use(
  (response) => {
    if (
      response.data &&
      typeof response.data === 'object' &&
      'success' in response.data &&
      'data' in response.data
    ) {
      response.data = response.data.data;
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Skip refresh for unauthenticated requests
    const storedTokenMultipart = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!storedTokenMultipart) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh((newToken) => {
          originalRequest._retry = true;
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          resolve(apiMultipart(originalRequest));
        });
        const unsub = () => reject(new Error('Token refresh failed'));
        refreshSubscribers.push(unsub as never);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const newToken = await doRefresh();
      isRefreshing = false;
      onTokenRefreshed(newToken);

      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
      }
      return apiMultipart(originalRequest);
    } catch (refreshError) {
      isRefreshing = false;
      onRefreshFailed();
      clearAuthAndRedirect();
      return Promise.reject(refreshError);
    }
  }
);
