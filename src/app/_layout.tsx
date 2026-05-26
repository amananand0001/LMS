import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus, View } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useNetworkStore } from '@/store/networkStore';
import OfflineBanner from '@/components/OfflineBanner';
import {
  setupNotificationHandler,
  requestNotificationPermissions,
  scheduleInactivityReminder,
  cancelInactivityReminder,
  recordAppActive,
  useNotificationObserver,
} from '@/services/notifications';

// Set up notification handler at module level (required by expo-notifications)
setupNotificationHandler();

// ─── Root Layout ──────────────────────────────────────────────────────────────

export default function RootLayout() {
  const initialize = useAuthStore((s) => s.initialize);
  const initNetworkListener = useNetworkStore((s) => s.initListener);
  const appState = useRef<AppStateStatus>(AppState.currentState);

  useNotificationObserver();

  useEffect(() => {
    // 1. Restore auth session
    initialize();

    // 2. Start network connectivity listener
    const unsubscribeNetwork = initNetworkListener();

    // 3. Request notification permissions on first launch
    requestNotificationPermissions();

    // 4. Record that the app is now active (cancel any pending inactivity reminder)
    recordAppActive();
    cancelInactivityReminder();

    // 5. AppState listener: schedule reminder on background, cancel on foreground
    const appStateSubscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      const previous = appState.current;
      appState.current = nextState;

      if (previous === 'active' && nextState === 'background') {
        recordAppActive();
        scheduleInactivityReminder();
      } else if (nextState === 'active' && previous !== 'active') {
        recordAppActive();
        cancelInactivityReminder();
      }
    });

    return () => {
      unsubscribeNetwork();
      appStateSubscription.remove();
    };
  }, [initialize, initNetworkListener]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <View style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
        <OfflineBanner />
      </View>
    </GestureHandlerRootView>
  );
}
