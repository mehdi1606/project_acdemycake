import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_URL, ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from '../../environment';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle ApiResponse wrapper and token refresh
api.interceptors.response.use(
  (response) => {
    // Log raw response for debugging
    console.log('API Response URL:', response.config.url);
    console.log('API Response raw data:', JSON.stringify(response.data).substring(0, 500));

    // Backend wraps responses in ApiResponse { success, message, data, timestamp }
    // Extract the data field if it's the ApiResponse format
    if (response.data && typeof response.data === 'object' &&
        'success' in response.data && 'data' in response.data) {
      console.log('Unwrapping ApiResponse, extracting data field');
      response.data = response.data.data;
    }

    console.log('API Response after processing:', Array.isArray(response.data) ? `Array[${response.data.length}]` : typeof response.data);
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If 401 and not already retrying, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh-token`, {
            refreshToken,
          });

          // Backend wraps response in ApiResponse { success, data: { accessToken, refreshToken } }
          const responseData = response.data?.data || response.data;
          const { accessToken, refreshToken: newRefreshToken } = responseData;

          localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
          localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);

          // Retry original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed - clear tokens and redirect to login
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// Helper function for multipart form data (file uploads)
export const apiMultipart = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
  timeout: 60000, // Longer timeout for file uploads
});

apiMultipart.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor for multipart - unwrap ApiResponse and handle token refresh
apiMultipart.interceptors.response.use(
  (response) => {
    // Unwrap ApiResponse wrapper if present
    if (response.data && typeof response.data === 'object' &&
        'success' in response.data && 'data' in response.data) {
      response.data = response.data.data;
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh-token`, {
            refreshToken,
          });

          const responseData = response.data?.data || response.data;
          const { accessToken, refreshToken: newRefreshToken } = responseData;

          localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
          localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }
          return apiMultipart(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
