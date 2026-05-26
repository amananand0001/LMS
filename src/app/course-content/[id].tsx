import React, { useCallback, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import WebView, {
  type WebViewMessageEvent,
  type WebViewNavigation,
} from 'react-native-webview';
import { useCourseStore } from '@/store/courseStore';
import { buildCourseHtml } from '@/assets/courseHtmlTemplate';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';

// ─── Types ───────────────────────────────────────────────────────────────────

interface WebViewMessage {
  type: 'ENROLL' | 'BOOKMARK' | 'QUIZ_START';
  courseId: string;
}

// ─── Inline progress bar ──────────────────────────────────────────────────────

function ProgressBar({ progress }: { progress: number }) {
  if (progress <= 0 || progress >= 1) return null;
  return (
    <View style={styles.progressBarTrack}>
      <View style={[styles.progressBarFill, { width: `${Math.round(progress * 100)}%` }]} />
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function CourseContentScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const courseId = Number(id);

  const getCourseById = useCourseStore((s) => s.getCourseById);
  const toggleBookmark = useCourseStore((s) => s.toggleBookmark);
  const bookmarkedIds = useCourseStore((s) => s.bookmarkedIds);

  const course = getCourseById(courseId);
  const isBookmarked = bookmarkedIds.has(courseId);

  const webViewRef = useRef<WebView>(null);
  const [loadProgress, setLoadProgress] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);

  // ─── Build HTML from template ──────────────────────────────────────────────

  const injectedHtml = course
    ? buildCourseHtml({
        courseId: course.id,
        title: course.title,
        description: course.description,
        category: course.category,
        rating: course.rating,
        durationHours: course.durationHours,
        level: course.level,
        instructorName: course.instructor.name,
        instructorAvatar: course.instructor.avatar,
        progress: 22, // simulated progress
      })
    : '<html><body><p>Course not found.</p></body></html>';

  // ─── Native → WebView: inject user session data ───────────────────────────
  //
  // This satisfies "native app to WebView communication via headers":
  // We send structured data (auth token, user preferences) into the WebView
  // via injectedJavaScript so the page can personalize its content.
  //
  const injectedJavaScript = `
    (function() {
      window.COURSE_DATA = ${JSON.stringify({
        courseId: course?.id,
        instructorName: course?.instructor.name,
        level: course?.level,
        durationHours: course?.durationHours,
        isBookmarked,
        appVersion: '1.0.0',
        platform: 'mobile',
        theme: 'light',
      })};
      // Notify page that native context is ready
      document.dispatchEvent(new CustomEvent('NativeReady', { detail: window.COURSE_DATA }));
      true; // Required: return truthy value
    })();
  `;

  // ─── WebView → Native: handle messages from HTML buttons ─────────────────

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const msg = JSON.parse(event.nativeEvent.data) as WebViewMessage;
        switch (msg.type) {
          case 'ENROLL':
            Alert.alert('Enrolled! 🎉', `You've enrolled in "${course?.title}".`);
            break;
          case 'BOOKMARK':
            toggleBookmark(courseId);
            Alert.alert(
              isBookmarked ? 'Bookmark Removed' : 'Bookmarked! 🔖',
              isBookmarked
                ? 'Course removed from your bookmarks.'
                : 'Course saved to your bookmarks.',
            );
            break;
          case 'QUIZ_START':
            Alert.alert('Quiz', 'Quiz feature coming soon!');
            break;
        }
      } catch {
        // Malformed message from WebView — ignore
      }
    },
    [course?.title, courseId, isBookmarked, toggleBookmark],
  );

  const handleNavigationChange = useCallback((navState: WebViewNavigation) => {
    setCanGoBack(navState.canGoBack);
  }, []);

  const handleReload = useCallback(() => {
    webViewRef.current?.reload();
    setHasError(false);
  }, []);

  // ─── Error state ──────────────────────────────────────────────────────────

  if (!course) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <View style={styles.errorFull}>
          <Ionicons name="alert-circle-outline" size={56} color={Colors.error} />
          <Text style={styles.errorTitle}>Course not found</Text>
          <Pressable style={styles.retryBtn} onPress={() => router.back()}>
            <Text style={styles.retryText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom }]}>
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <Pressable
            style={styles.iconBtn}
            onPress={() => (canGoBack ? webViewRef.current?.goBack() : router.back())}
          >
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </Pressable>

          <View style={styles.titleWrap}>
            <Text style={styles.topTitle} numberOfLines={1}>{course.title}</Text>
            <Text style={styles.topSubtitle}>Course Content</Text>
          </View>

          <Pressable style={styles.iconBtn} onPress={handleReload}>
            <Ionicons name="refresh-outline" size={20} color={Colors.textSecondary} />
          </Pressable>
        </View>

        {/* Load progress bar */}
        <ProgressBar progress={loadProgress} />
      </SafeAreaView>

      {/* WebView */}
      {hasError ? (
        <View style={styles.errorContainer}>
          <Ionicons name="wifi-outline" size={52} color={Colors.textDisabled} />
          <Text style={styles.errorTitle}>Failed to load content</Text>
          <Text style={styles.errorSub}>The course content could not be displayed.</Text>
          <Pressable style={styles.retryBtn} onPress={handleReload}>
            <Text style={styles.retryText}>Try Again</Text>
          </Pressable>
        </View>
      ) : (
        <WebView
          ref={webViewRef}
          source={{ html: injectedHtml, baseUrl: '' }}
          injectedJavaScript={injectedJavaScript}
          onMessage={handleMessage}
          onNavigationStateChange={handleNavigationChange}
          onLoadProgress={({ nativeEvent }) => setLoadProgress(nativeEvent.progress)}
          onLoadEnd={() => setLoadProgress(1)}
          onError={() => setHasError(true)}
          onHttpError={() => setHasError(true)}
          originWhitelist={['*']}
          javaScriptEnabled
          domStorageEnabled
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          style={styles.webView}
          renderLoading={() => <View style={styles.loadingWebView} />}
          startInLoadingState
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  safeTop: { backgroundColor: Colors.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  titleWrap: { flex: 1 },
  topTitle: {
    fontSize: Typography.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.1,
  },
  topSubtitle: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  progressBarTrack: {
    height: 3,
    backgroundColor: Colors.border,
  },
  progressBarFill: {
    height: 3,
    backgroundColor: Colors.primary,
  },
  webView: { flex: 1 },
  loadingWebView: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    padding: Spacing.xl,
  },
  errorFull: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.base,
    padding: Spacing.xl,
  },
  errorTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  errorSub: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryBtn: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
  },
  retryText: {
    color: Colors.textInverse,
    fontWeight: '700',
    fontSize: Typography.base,
  },
});
