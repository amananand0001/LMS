import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi, tokenStorage } from '@/services/api';
import type { LoginCredentials, RegisterCredentials, User } from '@/types/auth';

const USER_CACHE_KEY = 'lms_cached_user';

interface AuthState {
  // State
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  initialize: () => Promise<void>;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: (user) => {
    set({ user, isAuthenticated: user !== null });
    if (user) {
      AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(user)).catch(() => {});
    } else {
      AsyncStorage.removeItem(USER_CACHE_KEY).catch(() => {});
    }
  },

  // Called once on app start to hydrate from SecureStore
  initialize: async () => {
    set({ isLoading: true });
    try {
      const token = await tokenStorage.getAccessToken();
      if (token) {
        // 1. Try to load cached user profile so UI renders instantly offline
        const cachedUserStr = await AsyncStorage.getItem(USER_CACHE_KEY);
        if (cachedUserStr) {
          const cachedUser = JSON.parse(cachedUserStr);
          set({ user: cachedUser, isAuthenticated: true });
        } else {
          // If no cache but token exists, set authenticated anyway to avoid logging out
          set({ isAuthenticated: true });
        }

        // 2. Fetch fresh user profile from API in background/on-mount
        try {
          const response = await authApi.getCurrentUser();
          const freshUser = response.data.data;
          await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(freshUser));
          set({ user: freshUser, isAuthenticated: true });
        } catch (apiErr: any) {
          // Only clear session on explicit 401/403 auth failures
          if (apiErr.statusCode === 401 || apiErr.statusCode === 403) {
            await tokenStorage.clearTokens();
            await AsyncStorage.removeItem(USER_CACHE_KEY);
            set({ user: null, isAuthenticated: false });
          } else {
            // Network/Timeout/Offline error -> Keep cached session intact
            console.log('Offline/Network error during user hydration, keeping cached session');
          }
        }
      } else {
        set({ user: null, isAuthenticated: false });
      }
    } catch {
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (credentials) => {
    const payload: { email?: string; username?: string; password?: string } = {
      password: credentials.password,
    };
    if (credentials.username && credentials.username.includes('@')) {
      payload.email = credentials.username;
    } else {
      payload.username = credentials.username;
    }

    const response = await authApi.login(payload);
    const { user, accessToken, refreshToken } = response.data.data;
    await tokenStorage.saveTokens({ accessToken, refreshToken });
    await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
    set({ user, isAuthenticated: true });
  },

  register: async (credentials) => {
    await authApi.register(credentials);
    // Auto-login after register using username
    const loginRes = await authApi.login({
      username: credentials.username,
      password: credentials.password,
    });
    const { user, accessToken, refreshToken } = loginRes.data.data;
    await tokenStorage.saveTokens({ accessToken, refreshToken });
    await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
    set({ user, isAuthenticated: true });
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore API errors; always clear locally
    } finally {
      await tokenStorage.clearTokens();
      await AsyncStorage.removeItem(USER_CACHE_KEY);
      set({ user: null, isAuthenticated: false });
    }
  },

  refreshUser: async () => {
    try {
      const response = await authApi.getCurrentUser();
      const freshUser = response.data.data;
      await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(freshUser));
      set({ user: freshUser, isAuthenticated: true });
    } catch (apiErr: any) {
      if (apiErr.statusCode === 401 || apiErr.statusCode === 403) {
        await tokenStorage.clearTokens();
        await AsyncStorage.removeItem(USER_CACHE_KEY);
        set({ user: null, isAuthenticated: false });
      }
    }
  },
}));

// Convenience selector hooks
export const useUser = () => useAuthStore((s) => s.user);
export const useIsAuthenticated = () => useAuthStore((s) => s.isAuthenticated);
export const useAuthLoading = () => useAuthStore((s) => s.isLoading);
