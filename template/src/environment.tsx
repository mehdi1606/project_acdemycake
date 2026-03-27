// Environment Configuration
export const base_path = '/';
export const img_path = '/';

// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
export const API_VERSION = '/api/v1';
export const API_URL = `${API_BASE_URL}${API_VERSION}`;

// WebSocket Configuration
export const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:8080/ws';

// Token Configuration
export const ACCESS_TOKEN_KEY = 'accessToken';
export const REFRESH_TOKEN_KEY = 'refreshToken';
export const USER_KEY = 'user';

// App Configuration
export const APP_NAME = 'Academy';
export const DEFAULT_PAGE_SIZE = 10;

/**
 * Converts a file path (relative or already absolute) to a full HTTP URL.
 *
 * - If the path is already an absolute URL (starts with "http"), returns it as-is.
 * - If the path is a relative storage path (e.g. "courses/thumbnails/abc.jpg"),
 *   prepends the backend base-url + "/files/".
 * - If the path is null/empty, returns undefined so <img> can use its fallback.
 */
export const getFileUrl = (path?: string | null): string | undefined => {
  if (!path) return undefined;
  if (path.startsWith('http')) return path;
  return `${API_BASE_URL}/files/${path}`;
};
