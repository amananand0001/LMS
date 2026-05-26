/**
 * appStore.ts — Unified Zustand + AsyncStorage persist store
 *
 * Responsibility split:
 *   - Sensitive (token, refreshToken) → SecureStore via tokenStorage in api.ts
 *   - Bookmarks → courseStore (AsyncStorage, single source of truth)
 *   - User preferences & onboarding → this store (AsyncStorage via zustand persist)
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AppTheme = 'light' | 'dark' | 'system';

export interface AppPreferences {
  theme: AppTheme;
  notificationsEnabled: boolean;
  showCompletedCourses: boolean;
}

interface AppState {
  // ── User preferences ──────────────────────────────────────────────────────
  preferences: AppPreferences;

  // ── Onboarding flag ───────────────────────────────────────────────────────
  hasOnboarded: boolean;

  // ── Actions ───────────────────────────────────────────────────────────────
  setPreference: <K extends keyof AppPreferences>(key: K, value: AppPreferences[K]) => void;
  resetPreferences: () => void;
  setHasOnboarded: (value: boolean) => void;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_PREFERENCES: AppPreferences = {
  theme: 'system',
  notificationsEnabled: true,
  showCompletedCourses: true,
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      preferences: DEFAULT_PREFERENCES,
      hasOnboarded: false,

      setPreference: (key, value) =>
        set((state) => ({
          preferences: { ...state.preferences, [key]: value },
        })),

      resetPreferences: () => set({ preferences: DEFAULT_PREFERENCES }),

      setHasOnboarded: (value) => set({ hasOnboarded: value }),
    }),
    {
      name: 'lms-app-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        preferences: state.preferences,
        hasOnboarded: state.hasOnboarded,
      }),
    },
  ),
);

// ─── Convenience selectors ────────────────────────────────────────────────────

export const usePreferences = () => useAppStore((s) => s.preferences);
export const useTheme = () => useAppStore((s) => s.preferences.theme);
