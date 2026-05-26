import React, { memo, useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCourseStore } from '@/store/courseStore';
import { Colors, Radius, Shadow, Spacing, Typography } from '@/constants/theme';
import type { Course } from '@/types/course';

interface CourseCardProps {
  course: Course;
  compact?: boolean;
}

const LEVEL_COLORS: Record<Course['level'], string> = {
  Beginner: '#10B981',
  Intermediate: '#F59E0B',
  Advanced: '#EF4444',
};

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.5;
  return (
    <View style={styles.starRow}>
      {Array.from({ length: 5 }).map((_, i) => {
        let name: 'star' | 'star-half' | 'star-outline' = 'star-outline';
        if (i < full) name = 'star';
        else if (i === full && hasHalf) name = 'star-half';
        return (
          <Ionicons key={i} name={name} size={12} color="#F59E0B" />
        );
      })}
      <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
    </View>
  );
}

export const CourseCard = memo(function CourseCard({ course, compact = false }: CourseCardProps) {
  const bookmarkedIds = useCourseStore((s) => s.bookmarkedIds);
  const toggleBookmark = useCourseStore((s) => s.toggleBookmark);
  const isBookmarked = bookmarkedIds.has(course.id);

  const handlePress = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.push(`/course/${course.id}` as any);
  }, [course.id]);

  const handleBookmark = useCallback(
    (e: { stopPropagation?: () => void }) => {
      // Prevent card navigation when tapping bookmark
      toggleBookmark(course.id);
    },
    [course.id, toggleBookmark],
  );

  return (
    <Pressable
      style={({ pressed }) => [styles.card, compact && styles.cardCompact, pressed && styles.cardPressed]}
      onPress={handlePress}
      accessible
      accessibilityRole="button"
      accessibilityLabel={`${course.title} course by ${course.instructor.name}`}
    >
      {/* Thumbnail */}
      <View style={[styles.thumbnailWrap, compact && styles.thumbnailCompact]}>
        <Image
          source={{ uri: course.thumbnail }}
          style={styles.thumbnail}
          contentFit="cover"
          transition={300}
          cachePolicy="memory-disk"
        />
        {/* Level badge */}
        <View style={[styles.levelBadge, { backgroundColor: LEVEL_COLORS[course.level] }]}>
          <Text style={styles.levelText}>{course.level}</Text>
        </View>
        {/* Bookmark button */}
        <Pressable style={styles.bookmarkBtn} onPress={handleBookmark} hitSlop={8}>
          <Ionicons
            name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
            size={20}
            color={isBookmarked ? Colors.primary : Colors.textInverse}
          />
        </Pressable>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Category chip */}
        <View style={styles.categoryChip}>
          <Text style={styles.categoryText}>{course.category}</Text>
        </View>

        <Text style={styles.title} numberOfLines={2}>{course.title}</Text>

        {/* Instructor */}
        {!compact && (
          <View style={styles.instructorRow}>
            <Image
              source={{ uri: course.instructor.avatar }}
              style={styles.instructorAvatar}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
            <Text style={styles.instructorName} numberOfLines={1}>
              {course.instructor.name}
            </Text>
          </View>
        )}

        {/* Meta row */}
        <View style={styles.metaRow}>
          <StarRating rating={course.rating} />
          <View style={styles.metaDivider} />
          <Ionicons name="time-outline" size={12} color={Colors.textSecondary} />
          <Text style={styles.metaText}>{course.durationHours}h</Text>
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.background,
    borderRadius: Radius.xl,
    marginBottom: Spacing.base,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  cardCompact: {
    width: 200,
    marginBottom: 0,
  },
  cardPressed: {
    opacity: 0.93,
    transform: [{ scale: 0.985 }],
  },
  thumbnailWrap: {
    position: 'relative',
    height: 160,
  },
  thumbnailCompact: {
    height: 110,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  levelBadge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  levelText: {
    fontSize: Typography.xs,
    color: Colors.textInverse,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  bookmarkBtn: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 34,
    height: 34,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: Spacing.md,
  },
  categoryChip: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primarySoft,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    marginBottom: Spacing.xs,
  },
  categoryText: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: Typography.md,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    lineHeight: 22,
  },
  instructorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  instructorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  instructorName: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginLeft: 3,
  },
  metaDivider: {
    width: 1,
    height: 12,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.xs,
  },
  metaText: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});
