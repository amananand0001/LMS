import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ListRenderItem,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCourseStore } from '@/store/courseStore';
import { useNetworkStore } from '@/store/networkStore';
import { CourseCard } from '@/components/CourseCard';
import { SearchBar } from '@/components/ui/SearchBar';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { Colors, Radius, Shadow, Spacing, Typography } from '@/constants/theme';
import type { Course } from '@/types/course';

type FilterTab = 'All' | 'Bookmarked';

const FILTER_TABS: FilterTab[] = ['All', 'Bookmarked'];

function EmptyState({ query, tab }: { query: string; tab: FilterTab }) {
  if (tab === 'Bookmarked') {
    return (
      <View style={styles.emptyWrap}>
        <Ionicons name="bookmark-outline" size={52} color={Colors.textDisabled} />
        <Text style={styles.emptyTitle}>No bookmarks yet</Text>
        <Text style={styles.emptyText}>Tap the bookmark icon on any course to save it.</Text>
      </View>
    );
  }
  if (query.trim()) {
    return (
      <View style={styles.emptyWrap}>
        <Ionicons name="search-outline" size={52} color={Colors.textDisabled} />
        <Text style={styles.emptyTitle}>No results for &quot;{query}&quot;</Text>
        <Text style={styles.emptyText}>Try a different search term.</Text>
      </View>
    );
  }
  return (
    <View style={styles.emptyWrap}>
      <Ionicons name="school-outline" size={52} color={Colors.textDisabled} />
      <Text style={styles.emptyTitle}>No courses available</Text>
      <Text style={styles.emptyText}>Pull down to refresh.</Text>
    </View>
  );
}

function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.errorBanner}>
      <Ionicons name="wifi-outline" size={20} color={Colors.error} />
      <Text style={styles.errorText} numberOfLines={2}>{message}</Text>
      <TouchableOpacity onPress={onRetry} style={styles.retryBtn}>
        <Text style={styles.retryText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function CoursesScreen() {
  const courses = useCourseStore((s) => s.courses);
  const isLoading = useCourseStore((s) => s.isLoading);
  const isRefreshing = useCourseStore((s) => s.isRefreshing);
  const error = useCourseStore((s) => s.error);
  const searchQuery = useCourseStore((s) => s.searchQuery);
  const bookmarkedIds = useCourseStore((s) => s.bookmarkedIds);
  const fetchCourses = useCourseStore((s) => s.fetchCourses);
  const refreshCourses = useCourseStore((s) => s.refreshCourses);
  const loadBookmarks = useCourseStore((s) => s.loadBookmarks);
  const setSearchQuery = useCourseStore((s) => s.setSearchQuery);
  const isOfflineCached = useCourseStore((s) => s.isOfflineCached);
  const isConnected = useNetworkStore((s) => s.isConnected);

  const [activeTab, setActiveTab] = useState<FilterTab>('All');

  // ── Derived data ────────────────────────────────────────────────────────────
  const q = searchQuery.toLowerCase().trim();
  const filtered = q
    ? courses.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q) ||
          c.instructor.name.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q),
      )
    : courses;

  const bookmarked = courses.filter((c) => bookmarkedIds.has(c.id));
  const displayedCourses = activeTab === 'Bookmarked' ? bookmarked : filtered;

  // Fetch on first mount only — stable empty-array deps avoids stale closure re-runs
  useEffect(() => {
    loadBookmarks();
    fetchCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderItem = useCallback<ListRenderItem<Course>>(
    ({ item }) => <CourseCard course={item} />,
    [],
  );

  const keyExtractor = useCallback((item: Course) => String(item.id), []);

  const getItemLayout = useCallback(
    (_: ArrayLike<Course> | null | undefined, index: number) => ({
      length: 260,
      offset: 260 * index,
      index,
    }),
    [],
  );

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Courses</Text>
          <View style={styles.subtitleRow}>
            <Text style={styles.subtitle}>{displayedCourses.length} courses available</Text>
            {isOfflineCached && !isConnected && (
              <View style={styles.offlineBadge}>
                <Ionicons name="cloud-offline-outline" size={10} color="#D97706" />
                <Text style={styles.offlineBadgeText}>Cached</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.headerIconWrap}>
          <Ionicons name="filter-outline" size={22} color={Colors.primary} />
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <SearchBar value={searchQuery} onChangeText={setSearchQuery} />
      </View>

      {/* Filter tabs */}
      <View style={styles.tabRow}>
        {FILTER_TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.75}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Error banner */}
      {error ? <ErrorBanner message={error} onRetry={fetchCourses} /> : null}

      {/* List */}
      <FlatList
        data={displayedCourses}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        contentContainerStyle={[
          styles.listContent,
          displayedCourses.length === 0 && styles.listEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshCourses}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={
          isLoading
            ? <View style={styles.loadingContainer}><LoadingOverlay visible /></View>
            : <EmptyState query={searchQuery} tab={activeTab} />
        }
        maxToRenderPerBatch={8}
        windowSize={10}
        initialNumToRender={6}
        removeClippedSubviews
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface },
  loadingContainer: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.md,
  },
  title: {
    fontSize: Typography['2xl'],
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  headerLeft: { flex: 1 },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: 2,
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  offlineBadgeText: {
    fontSize: 10,
    color: '#D97706',
    fontWeight: '700',
  },
  headerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.md,
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  tab: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  tabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  tabTextActive: {
    color: Colors.textInverse,
  },
  listContent: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing['4xl'],
  },
  listEmpty: {
    flexGrow: 1,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['5xl'],
    gap: Spacing.md,
  },
  emptyTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.errorLight,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  errorText: {
    flex: 1,
    fontSize: Typography.sm,
    color: Colors.error,
  },
  retryBtn: {
    backgroundColor: Colors.error,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
  },
  retryText: {
    fontSize: Typography.sm,
    color: Colors.textInverse,
    fontWeight: '700',
  },
});
