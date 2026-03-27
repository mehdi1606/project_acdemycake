import api from './axios.config';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  User,
  AuthTokens,
} from './types';
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY } from '../../environment';

class AuthService {
  // Login user
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    // Note: axios interceptor already extracts data from ApiResponse wrapper
    const response = await api.post<LoginResponse>('/auth/login', credentials);
    const loginData = response.data;
    this.setTokens(loginData);
    this.setUser(loginData.user);
    return loginData;
  }

  // Register new user (requires email verification before login)
  async register(userData: RegisterRequest): Promise<RegisterResponse> {
    const response = await api.post<RegisterResponse>('/auth/register', userData);
    // Don't auto-login - user needs to verify email first
    return response.data;
  }

  // Logout from current session
  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } finally {
      this.clearAuth();
    }
  }

  // Logout from all sessions
  async logoutAll(): Promise<void> {
    try {
      await api.post('/auth/logout-all');
    } finally {
      this.clearAuth();
    }
  }

  // Get current user details
  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>('/auth/me');
    const user = response.data;
    this.setUser(user);
    return user;
  }

  // Verify email
  async verifyEmail(token: string): Promise<void> {
    await api.post('/auth/verify-email', { token });
  }

  // Resend verification email
  async resendVerificationEmail(email: string): Promise<void> {
    await api.post('/auth/resend-verification', { email });
  }

  // Request password reset
  async forgotPassword(email: string): Promise<void> {
    await api.post('/auth/forgot-password', { email });
  }

  // Reset password with token
  async resetPassword(token: string, newPassword: string): Promise<void> {
    await api.post('/auth/reset-password', { token, newPassword });
  }

  // Refresh tokens
  async refreshToken(): Promise<AuthTokens> {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    const response = await api.post<AuthTokens>('/auth/refresh-token', { refreshToken });
    const tokens = response.data;
    this.setTokens(tokens);
    return tokens;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  // Get stored user
  getStoredUser(): User | null {
    const userJson = localStorage.getItem(USER_KEY);
    if (userJson) {
      try {
        return JSON.parse(userJson);
      } catch {
        return null;
      }
    }
    return null;
  }

  // Get access token
  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  // Helper methods
  private setTokens(tokens: AuthTokens): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  }

  private setUser(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  private clearAuth(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
}

export const authService = new AuthService();
export default authService;
