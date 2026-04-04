import { AxiosError } from 'axios';

/**
 * Extracts a human-readable error message from an Axios error or any unknown
 * thrown value. Handles the backend ApiResponse error shape, validation errors,
 * and network failures.
 */
export function extractApiError(error: unknown, fallback = 'An unexpected error occurred'): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data;

    if (data) {
      // Backend ApiResponse shape: { success: false, message: string, data: ... }
      if (typeof data.message === 'string' && data.message) {
        return data.message;
      }
      // Spring validation errors: { errors: { field: 'message' } }
      if (data.errors && typeof data.errors === 'object') {
        const first = Object.values(data.errors)[0];
        if (typeof first === 'string') return first;
      }
    }

    // Network / timeout
    if (error.code === 'ECONNABORTED') return 'Request timed out. Please try again.';
    if (!error.response) return 'Network error. Please check your connection.';

    // HTTP status fallbacks
    switch (error.response.status) {
      case 400: return 'Invalid request. Please check your input.';
      case 401: return 'Session expired. Please log in again.';
      case 403: return 'You do not have permission to perform this action.';
      case 404: return 'The requested resource was not found.';
      case 409: return 'A conflict occurred. The resource may already exist.';
      case 429: return 'Too many requests. Please try again later.';
      case 500: return 'Server error. Please try again later.';
      default:  return fallback;
    }
  }

  if (error instanceof Error) return error.message || fallback;

  return fallback;
}
