import React, { useCallback, useEffect } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useCourseStore } from '@/store/courseStore';
import { Button } from '@/components/ui/Button';
import { Colors, Radius, Shadow, Spacing, Typography } from '@/constants/theme';

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.5;
  return (
    <View style={styles.starRow}>
      {Array.from({ length: 5 }).map((_, i) => {
        let name: 'star' | 'star-half' | 'star-outline' = 'star-outline';
        if (i < full) name = 'star';
        else if (i === full && hasHalf) name = 'star-half';
        return <Ionicons key={i} name={name} size={16} color="#F59E0B" />;
      })}
      <Text style={styles.ratingNum}>{rating.toFixed(1)}</Text>
    </View>
  );
}

interface InfoChipProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}

function InfoChip({ icon, label }: InfoChipProps) {
  return (
    <View style={styles.chip}>
      <Ionicons name={icon} size={14} color={Colors.primary} />
      <Text style={styles.chipText}>{label}</Text>
    </View>
  );
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const WHAT_YOU_LEARN = [
  'Core concepts and fundamentals',
  'Hands-on practical exercises',
  'Real-world project experience',
  'Industry best practices',
  'Performance optimization tips',
  'Assessment and certification',
];

export default function CourseDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const courseId = Number(id);

  const getCourseById = useCourseStore((s) => s.getCourseById);
  const bookmarkedIds = useCourseStore((s) => s.bookmarkedIds);
  const toggleBookmark = useCourseStore((s) => s.toggleBookmark);
  const loadBookmarks = useCourseStore((s) => s.loadBookmarks);

  const course = getCourseById(courseId);
  const isBookmarked = bookmarkedIds.has(courseId);

  useEffect(() => {
    loadBookmarks();
  }, [loadBookmarks]);

  const handleBookmark = useCallback(() => {
    toggleBookmark(courseId);
  }, [courseId, toggleBookmark]);

  if (!course) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <View style={styles.notFound}>
          <Ionicons name="alert-circle-outline" size={56} color={Colors.error} />
          <Text style={styles.notFoundTitle}>Course not found</Text>
          <Button title="Go Back" onPress={() => router.back()} style={styles.backBtn} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} bounces>
        {/* Hero image */}
        <View style={styles.heroWrap}>
          <Image
            source={{ uri: course.thumbnail }}
            style={styles.hero}
            contentFit="cover"
            transition={300}
            cachePolicy="memory-disk"
          />
          {/* Gradient overlay */}
          <View style={styles.heroOverlay} />

          {/* Top bar (back + bookmark) */}
          <SafeAreaView edges={['top']} style={styles.heroTopBar}>
            <Pressable style={styles.heroBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={22} color={Colors.textInverse} />
            </Pressable>
            <Pressable style={styles.heroBtn} onPress={handleBookmark}>
              <Ionicons
                name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                size={22}
                color={isBookmarked ? Colors.primary : Colors.textInverse}
              />
            </Pressable>
          </SafeAreaView>

          {/* Category on image */}
          <View style={styles.heroBadgeWrap}>
            <View style={styles.heroCategoryBadge}>
              <Text style={styles.heroCategoryText}>{course.category}</Text>
            </View>
          </View>
        </View>

        {/* Body */}
        <View style={styles.body}>
          {/* Title + rating */}
          <Text style={styles.courseTitle}>{course.title}</Text>
          <View style={styles.metaRow}>
            <StarRating rating={course.rating} />
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.metaLevel}>{course.level}</Text>
          </View>

          {/* Chips row */}
          <View style={styles.chipsRow}>
            <InfoChip icon="time-outline" label={`${course.durationHours} hours`} />
            <InfoChip icon="library-outline" label={course.brand} />
            <InfoChip icon="person-outline" label={course.level} />
          </View>

          {/* Instructor card */}
          <View style={styles.instructorCard}>
            <Image
              source={{ uri: course.instructor.avatar }}
              style={styles.instructorAvatar}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
            <View style={styles.instructorInfo}>
              <Text style={styles.instructorLabel}>Your Instructor</Text>
              <Text style={styles.instructorName}>{course.instructor.name}</Text>
              <View style={styles.instructorLocationRow}>
                <Ionicons name="location-outline" size={12} color={Colors.textSecondary} />
                <Text style={styles.instructorLocation}>{course.instructor.location}</Text>
              </View>
            </View>
            <Pressable style={styles.followBtn}>
              <Text style={styles.followText}>Follow</Text>
            </Pressable>
          </View>

          {/* About */}
          <Section title="About this course">
            <Text style={styles.description}>{course.description}</Text>
          </Section>

          {/* What you'll learn */}
          <Section title="What you'll learn">
            {WHAT_YOU_LEARN.map((item, i) => (
              <View key={i} style={styles.learnItem}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                <Text style={styles.learnText}>{item}</Text>
              </View>
            ))}
          </Section>

          {/* Requirements */}
          <Section title="Requirements">
            <Text style={styles.description}>
              Basic understanding of the subject area. Access to a computer with internet. Willingness to learn and practice regularly.
            </Text>
          </Section>
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <View style={[styles.ctaBar, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}>
        <Button
          title="View Content"
          variant="outline"
          onPress={() => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            router.push(`/course-content/${course.id}` as any);
          }}
          fullWidth={false}
          style={styles.viewBtn}
          size="md"
        />
        <Button
          title="Enroll Now"
          onPress={() => {
            Alert.alert(
              'Enrolled! 🎉',
              `You've successfully enrolled in "${course.title}". Check the Course Content to start learning!`,
              [{ text: 'Start Learning', onPress: () => router.push(`/course-content/${course.id}` as any) },
               { text: 'Later', style: 'cancel' }]
            );
          }}
          fullWidth={false}
          style={styles.enrollBtn}
          size="md"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  heroWrap: { height: 280, position: 'relative' },
  hero: { width: '100%', height: '100%' },
  heroOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.32)',
  },
  heroTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
  },
  heroBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBadgeWrap: {
    position: 'absolute',
    bottom: Spacing.base,
    left: Spacing.base,
  },
  heroCategoryBadge: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
  },
  heroCategoryText: {
    fontSize: Typography.xs,
    color: Colors.textInverse,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  body: {
    padding: Spacing.base,
    paddingBottom: 100,
  },
  courseTitle: {
    fontSize: Typography['2xl'],
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
    marginBottom: Spacing.sm,
    lineHeight: 30,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.base,
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingNum: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginLeft: 4,
  },
  metaDot: {
    color: Colors.textDisabled,
    fontSize: Typography.base,
  },
  metaLevel: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.primarySoft,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  chipText: {
    fontSize: Typography.sm,
    color: Colors.primary,
    fontWeight: '600',
  },
  instructorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.base,
    marginBottom: Spacing.xl,
    gap: Spacing.md,
    ...Shadow.sm,
  },
  instructorAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  instructorInfo: { flex: 1 },
  instructorLabel: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginBottom: 2,
  },
  instructorName: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  instructorLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  instructorLocation: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
  },
  followBtn: {
    backgroundColor: Colors.primarySoft,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
  },
  followText: {
    fontSize: Typography.sm,
    color: Colors.primary,
    fontWeight: '700',
  },
  section: { marginBottom: Spacing.xl },
  sectionTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    letterSpacing: -0.2,
  },
  description: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  learnItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  learnText: {
    flex: 1,
    fontSize: Typography.base,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  ctaBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    ...Shadow.lg,
  },
  viewBtn: { flex: 1 },
  enrollBtn: { flex: 1 },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.base,
    padding: Spacing.xl,
  },
  notFoundTitle: {
    fontSize: Typography.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  backBtn: { marginTop: Spacing.base },
});
