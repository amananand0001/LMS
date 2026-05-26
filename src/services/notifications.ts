import { useEffect } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

let Notifications: any = null;
try {
  Notifications = {
    setNotificationHandler: require('expo-notifications/build/NotificationsHandler').setNotificationHandler,
    setNotificationChannelAsync: require('expo-notifications/build/setNotificationChannelAsync').setNotificationChannelAsync,
    getPermissionsAsync: require('expo-notifications/build/NotificationPermissions').getPermissionsAsync,
    requestPermissionsAsync: require('expo-notifications/build/NotificationPermissions').requestPermissionsAsync,
    scheduleNotificationAsync: require('expo-notifications/build/scheduleNotificationAsync').scheduleNotificationAsync,
    cancelScheduledNotificationAsync: require('expo-notifications/build/cancelScheduledNotificationAsync').cancelScheduledNotificationAsync,
    getLastNotificationResponse: require('expo-notifications/build/NotificationsEmitter').getLastNotificationResponse,
    addNotificationResponseReceivedListener: require('expo-notifications/build/NotificationsEmitter').addNotificationResponseReceivedListener,
    AndroidImportance: require('expo-notifications/build/NotificationChannelManager.types').AndroidImportance,
    SchedulableTriggerInputTypes: require('expo-notifications/build/Notifications.types').SchedulableTriggerInputTypes,
  };
} catch (e) {
  console.warn('expo-notifications could not be loaded via specific imports.', e);
}

// ─── Storage keys ─────────────────────────────────────────────────────────────

const KEYS = {
  INACTIVITY_NOTIF_ID: 'lms_inactivity_notif_id',
  LAST_ACTIVE_TS: 'lms_last_active_ts',
  PERMISSION_ASKED: 'lms_notif_permission_asked',
  BOOKMARK_MILESTONE_FIRED: 'lms_bookmark_milestone_fired', // comma-separated milestones already sent
} as const;

// ─── Channel ids (Android) ────────────────────────────────────────────────────

const CHANNELS = {
  GENERAL: 'lms-general',
  REMINDERS: 'lms-reminders',
} as const;

// ─── Handler (must be called at module level before any scheduling) ───────────
// Call this once from the root layout.

export function setupNotificationHandler() {
  if (!Notifications) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

// ─── Hook: redirect to screen when user taps a notification ──────────────────

export function useNotificationObserver() {
  useEffect(() => {
    if (!Notifications) return;

    // Handle notification tapped while app was closed
    const lastResponse = Notifications.getLastNotificationResponse();
    if (lastResponse) {
      handleNotificationResponse(lastResponse);
    }

    // Handle notification tapped while app is running (foreground/background)
    const subscription = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse,
    );

    return () => subscription.remove();
  }, []);
}

function handleNotificationResponse(response: import('expo-notifications').NotificationResponse) {
  const data = response.notification.request.content.data as Record<string, unknown>;
  if (data?.type === 'inactivity_reminder') {
    // Navigate to courses tab when user taps inactivity reminder
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.push('/(main)/courses' as any);
  }
}

// ─── Android channels ─────────────────────────────────────────────────────────

async function ensureAndroidChannels() {
  if (!Notifications || Platform.OS !== 'android') return;
  await Promise.all([
    Notifications.setNotificationChannelAsync(CHANNELS.GENERAL, {
      name: 'General',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2563EB',
    }),
    Notifications.setNotificationChannelAsync(CHANNELS.REMINDERS, {
      name: 'Study Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 150, 100, 150],
      lightColor: '#10B981',
    }),
  ]);
}

// ─── Permission request ───────────────────────────────────────────────────────

export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    if (!Notifications) return false;

    // Android 13+: channel must exist before requesting permissions
    await ensureAndroidChannels();

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    if (existingStatus === 'granted') return true;

    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: false,
        allowSound: true,
      },
    });

    await AsyncStorage.setItem(KEYS.PERMISSION_ASKED, 'true');
    return status === 'granted';
  } catch {
    return false;
  }
}

export async function getNotificationPermissionStatus(): Promise<'granted' | 'denied' | 'undetermined'> {
  try {
    if (!Notifications) return 'undetermined';
    const { status } = await Notifications.getPermissionsAsync();
    return status as 'granted' | 'denied' | 'undetermined';
  } catch {
    return 'undetermined';
  }
}

// ─── Bookmark milestone notification ─────────────────────────────────────────
//
// Fire once when bookmarks reach milestone counts (5, 10, 20, …).

const BOOKMARK_MILESTONES = [5, 10, 20];

const MILESTONE_MESSAGES: Record<number, { title: string; body: string }> = {
  5: {
    title: '🔖 5 Courses Saved!',
    body: 'Nice collection! You\'ve bookmarked 5 courses. Ready to start learning?',
  },
  10: {
    title: '📚 10 Courses Bookmarked!',
    body: 'You\'re on fire! 10 courses saved — pick one and begin your journey today.',
  },
  20: {
    title: '🏆 20 Courses Saved!',
    body: 'Impressive library! You have 20 bookmarks. Your next great skill awaits.',
  },
};

export async function checkBookmarkMilestone(bookmarkCount: number): Promise<void> {
  try {
    if (!Notifications) return;
    const status = await getNotificationPermissionStatus();
    if (status !== 'granted') return;

    const firedRaw = await AsyncStorage.getItem(KEYS.BOOKMARK_MILESTONE_FIRED);
    const fired = new Set<number>((firedRaw ? JSON.parse(firedRaw) : []) as number[]);

    for (const milestone of BOOKMARK_MILESTONES) {
      if (bookmarkCount >= milestone && !fired.has(milestone)) {
        const message = MILESTONE_MESSAGES[milestone];

        await Notifications.scheduleNotificationAsync({
          content: {
            title: message.title,
            body: message.body,
            data: { type: 'bookmark_milestone', milestone },
            ...(Platform.OS === 'android' && { channelId: CHANNELS.GENERAL }),
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: 1, // Show almost immediately
          },
        });

        fired.add(milestone);
        await AsyncStorage.setItem(
          KEYS.BOOKMARK_MILESTONE_FIRED,
          JSON.stringify([...fired]),
        );
        break; // Only one milestone notification per bookmark action
      }
    }
  } catch {
    // Notification scheduling is non-critical — fail silently
  }
}

// ─── 24-hour inactivity reminder ─────────────────────────────────────────────
//
// When app goes to background → schedule a reminder for 24 hours later.
// When app returns to foreground → cancel the pending reminder + save new timestamp.

const INACTIVITY_SECONDS = 24 * 60 * 60; // 24 hours

export async function scheduleInactivityReminder(): Promise<void> {
  try {
    if (!Notifications) return;
    const status = await getNotificationPermissionStatus();
    if (status !== 'granted') return;

    // Cancel any previous inactivity reminder first
    await cancelInactivityReminder();

    const notifId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '📖 Time to learn something new!',
        body: 'You haven\'t opened LearnHub in a while. Your courses are waiting for you!',
        data: { type: 'inactivity_reminder' },
        ...(Platform.OS === 'android' && { channelId: CHANNELS.REMINDERS }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: INACTIVITY_SECONDS,
        repeats: false,
      },
    });

    await AsyncStorage.setItem(KEYS.INACTIVITY_NOTIF_ID, notifId);
  } catch {
    // Non-critical — fail silently
  }
}

export async function cancelInactivityReminder(): Promise<void> {
  try {
    if (!Notifications) return;
    const notifId = await AsyncStorage.getItem(KEYS.INACTIVITY_NOTIF_ID);
    if (notifId) {
      await Notifications.cancelScheduledNotificationAsync(notifId);
      await AsyncStorage.removeItem(KEYS.INACTIVITY_NOTIF_ID);
    }
  } catch {
    // Non-critical
  }
}

export async function recordAppActive(): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.LAST_ACTIVE_TS, String(Date.now()));
  } catch {
    // Non-critical
  }
}
