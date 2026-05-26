import axios, { type AxiosInstance, type InternalAxiosRequestConfig, type AxiosResponse } from 'axios';
import * as SecureStore from 'expo-secure-store';
import type {
  ApiResponse,
  AuthTokens,
  LoginCredentials,
  LoginResponseData,
  RegisterCredentials,
  User,
} from '@/types/auth';
import type { PaginatedResponse, RawProduct, RawUser } from '@/types/course';

const BASE_URL = 'https://api.freeapi.app/api/v1';

export const SECURE_KEYS = {
  ACCESS_TOKEN: 'lms_access_token',
  REFRESH_TOKEN: 'lms_refresh_token',
} as const;

// ─── Token Storage ──────────────────────────────────────────────────────────

export const tokenStorage = {
  getAccessToken: () => SecureStore.getItemAsync(SECURE_KEYS.ACCESS_TOKEN),
  getRefreshToken: () => SecureStore.getItemAsync(SECURE_KEYS.REFRESH_TOKEN),

  saveTokens: async (tokens: AuthTokens) => {
    await Promise.all([
      SecureStore.setItemAsync(SECURE_KEYS.ACCESS_TOKEN, tokens.accessToken),
      SecureStore.setItemAsync(SECURE_KEYS.REFRESH_TOKEN, tokens.refreshToken),
    ]);
  },

  clearTokens: async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(SECURE_KEYS.ACCESS_TOKEN),
      SecureStore.deleteItemAsync(SECURE_KEYS.REFRESH_TOKEN),
    ]);
  },
};

// ─── Axios Instance ──────────────────────────────────────────────────────────

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request Interceptor — attach Bearer token ───────────────────────────────

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await tokenStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response Interceptor — handle 401 refresh → retry ──────────────────────

let isRefreshing = false;
let pendingQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

function processQueue(error: unknown, token: string | null) {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token!);
  });
  pendingQueue = [];
}

// ─── Response Interceptor — retry + 401 refresh ──────────────────────────────
//
// Retry policy: transient network errors (no response or 5xx) are retried up to
// MAX_RETRIES times with exponential backoff. 401s trigger token refresh instead.

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 400; // doubles each attempt

type RetryableConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
  _retryCount?: number;
};

function isRetryable(error: any): boolean {
  // Retry on network error (no response) or 5xx server errors
  if (!error.response) return true;
  return error.response.status >= 500;
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const config = error.config as RetryableConfig;

    // ── Step 1: Retry transient failures ──────────────────────────────────────
    if (isRetryable(error) && config) {
      config._retryCount = (config._retryCount ?? 0) + 1;
      if (config._retryCount <= MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS * config._retryCount);
        return api(config);
      }
    }

    // ── Step 2: Handle 401 — attempt token refresh ────────────────────────────
    const originalRequest = config as RetryableConfig;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await tokenStorage.getRefreshToken();
        if (!refreshToken) throw new Error('No refresh token');

        const response = await axios.post<ApiResponse<AuthTokens>>(
          `${BASE_URL}/users/refresh-token`,
          { refreshToken },
        );

        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        await tokenStorage.saveTokens({ accessToken, refreshToken: newRefreshToken });

        processQueue(null, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await tokenStorage.clearTokens();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Normalize error message from API envelope
    const message = error.response?.data?.message ?? error.message ?? 'An error occurred';
    const normalizedError = new Error(message) as Error & { statusCode?: number; data?: unknown };
    normalizedError.statusCode = error.response?.status;
    normalizedError.data = error.response?.data;
    return Promise.reject(normalizedError);
  },
);

// ─── Auth Endpoints ──────────────────────────────────────────────────────────

export const authApi = {
  register: (credentials: RegisterCredentials) =>
    api.post<ApiResponse<LoginResponseData>>('/users/register', credentials),

  login: (credentials: LoginCredentials) =>
    api.post<ApiResponse<LoginResponseData>>('/users/login', credentials),

  getCurrentUser: () =>
    api.get<ApiResponse<User>>('/users/current-user'),

  logout: () =>
    api.post<ApiResponse<Record<string, never>>>('/users/logout'),

  updateAvatar: (formData: FormData) =>
    api.patch<ApiResponse<User>>('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// ─── Public Endpoints (no auth required) ─────────────────────────────────────

export const publicApi = {
  getRandomProducts: (page = 1, limit = 20) =>
    api.get<ApiResponse<PaginatedResponse<RawProduct>>>('/public/randomproducts', {
      params: { page, limit },
    }),

  getRandomUsers: (page = 1, limit = 20) =>
    api.get<ApiResponse<PaginatedResponse<RawUser>>>('/public/randomusers', {
      params: { page, limit },
    }),
};

export default api;
