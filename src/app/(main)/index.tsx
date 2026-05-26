import React, { useCallback, useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useCourseStore } from '@/store/courseStore';
import { Avatar } from '@/components/ui/Avatar';
import { CourseCard } from '@/components/CourseCard';
import { Colors, Radius, Shadow, Spacing, Typography } from '@/constants/theme';
import type { Course } from '@/types/course';

type IoniconsName = keyof typeof Ionicons.glyphMap;

interface StatCardProps {
  icon: IoniconsName;
  value: string;
  label: string;
  color: string;
}

function StatCard({ icon, value, label, color }: StatCardProps) {
  return (
    <View style={[styles.statCard, { borderTopColor: color }]}>
      <Ionicons name={icon} size={22} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

interface QuickActionProps {
  icon: IoniconsName;
  label: string;
  color?: string;
  onPress: () => void;
}

function QuickAction({ icon, label, color = Colors.primary, onPress }: QuickActionProps) {
  return (
    <Pressable style={styles.quickAction} onPress={onPress}>
      <View style={[styles.quickActionIcon, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </Pressable>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const bookmarkedIds = useCourseStore((s) => s.bookmarkedIds);
  const courses = useCourseStore((s) => s.courses);
  const fetchCourses = useCourseStore((s) => s.fetchCourses);
  const loadBookmarks = useCourseStore((s) => s.loadBookmarks);

  useEffect(() => {
    loadBookmarks();
    if (courses.length === 0) fetchCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Show the 4 most recently loaded courses
  const recentCourses = courses.slice(0, 4);
  const bookmarkedCourses = courses.filter((c) => bookmarkedIds.has(c.id)).slice(0, 4);

  const renderCourseItem = useCallback(
    ({ item }: { item: Course }) => <CourseCard course={item} compact />,
    [],
  );

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.userName} numberOfLines={1}>
              {user?.username ?? 'Learner'} 👋
            </Text>
          </View>
          <Pressable onPress={() => router.push('/(main)/profile')}>
            <Avatar uri={user?.avatar?.url} name={user?.username} size={42} />
          </Pressable>
        </View>

        {/* Banner */}
        <View style={styles.banner}>
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>Ready to learn today?</Text>
            <Text style={styles.bannerSubtitle}>
              Continue where you left off or explore new courses.
            </Text>
          </View>
          <Ionicons name="rocket" size={44} color="rgba(255,255,255,0.9)" />
        </View>

        {/* Stats */}
        <Text style={styles.sectionTitle}>Your Progress</Text>
        <View style={styles.statsRow}>
          <StatCard icon="book-outline" value={String(courses.length)} label="Available" color={Colors.primary} />
          <StatCard icon="checkmark-circle-outline" value="0" label="Completed" color={Colors.success} />
          <StatCard icon="bookmark-outline" value={String(bookmarkedIds.size)} label="Saved" color={Colors.accent} />
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsRow}>
          <QuickAction
            icon="search-outline"
            label="Browse"
            color={Colors.primary}
            onPress={() => router.push('/(main)/courses')}
          />
          <QuickAction
            icon="bookmark-outline"
            label="Saved"
            color={Colors.accent}
            onPress={() => router.push('/(main)/courses')}
          />
          <QuickAction
            icon="person-outline"
            label="Profile"
            color={Colors.success}
            onPress={() => router.push('/(main)/profile')}
          />
          <QuickAction
            icon="trophy-outline"
            label="Explore"
            color={Colors.warning}
            onPress={() => router.push('/(main)/courses')}
          />
        </View>

        {/* Continue Learning — bookmarked courses */}
        {bookmarkedCourses.length > 0 && (
          <>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Saved Courses</Text>
              <Pressable onPress={() => router.push('/(main)/courses')}>
                <Text style={styles.seeAll}>See all</Text>
              </Pressable>
            </View>
            <FlatList
              data={bookmarkedCourses}
              renderItem={renderCourseItem}
              keyExtractor={(item) => String(item.id)}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
              scrollEnabled={false}
            />
          </>
        )}

        {/* Recent Courses */}
        {recentCourses.length > 0 && (
          <>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Recent Courses</Text>
              <Pressable onPress={() => router.push('/(main)/courses')}>
                <Text style={styles.seeAll}>See all</Text>
              </Pressable>
            </View>
            {recentCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface },
  scroll: { paddingHorizontal: Spacing.base, paddingBottom: Spacing['4xl'] },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.base,
    paddingBottom: Spacing.xl,
  },
  headerLeft: { flex: 1, marginRight: Spacing.md },
  greeting: { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: '500' },
  userName: {
    fontSize: Typography.xl,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  banner: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    ...Shadow.md,
  },
  bannerContent: { flex: 1, marginRight: Spacing.base },
  bannerTitle: { fontSize: Typography.lg, fontWeight: '700', color: Colors.textInverse, marginBottom: Spacing.xs },
  bannerSubtitle: { fontSize: Typography.sm, color: 'rgba(255,255,255,0.8)', lineHeight: 18 },
  sectionTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    letterSpacing: -0.2,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  seeAll: {
    fontSize: Typography.sm,
    color: Colors.primary,
    fontWeight: '600',
  },
  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl },
  statCard: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    borderTopWidth: 3,
    gap: 4,
    ...Shadow.sm,
  },
  statValue: { fontSize: Typography.xl, fontWeight: '800' },
  statLabel: { fontSize: Typography.xs, color: Colors.textSecondary, fontWeight: '500' },
  quickActionsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl },
  quickAction: { flex: 1, alignItems: 'center', gap: Spacing.xs },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  quickActionLabel: { fontSize: Typography.xs, color: Colors.textSecondary, fontWeight: '600' },
  horizontalList: { gap: Spacing.sm, paddingBottom: Spacing.sm },
});
