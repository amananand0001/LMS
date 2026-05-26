import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { publicApi } from '@/services/api';
import { checkBookmarkMilestone } from '@/services/notifications';
import type { Course, RawProduct, RawUser } from '@/types/course';

const BOOKMARKS_KEY = 'lms_bookmarked_courses';
const COURSES_CACHE_KEY = 'lms_courses_cache';
const LEVELS = ['Beginner', 'Intermediate', 'Advanced'] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function deriveLevel(id: number): Course['level'] {
  return LEVELS[id % 3];
}

function mapToCourse(product: RawProduct, instructor: RawUser): Course {
  return {
    id: product.id,
    title: product.title,
    description: product.description,
    durationHours: Math.round(product.price / 100) + 2,
    price: product.price,
    rating: product.rating,
    category: product.category,
    level: deriveLevel(product.id),
    thumbnail: product.thumbnail,
    images: product.images,
    brand: product.brand,
    instructor: {
      id: instructor.id,
      name: `${instructor.name.first} ${instructor.name.last}`,
      avatar: instructor.picture.medium,
      location: `${instructor.location.city}, ${instructor.location.country}`,
    },
  };
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface CourseState {
  courses: Course[];
  bookmarkedIds: Set<number>;
  searchQuery: string;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  isOfflineCached: boolean; // true when showing stale cached data

  // Computed
  filteredCourses: () => Course[];
  bookmarkedCourses: () => Course[];

  // Actions
  fetchCourses: () => Promise<void>;
  refreshCourses: () => Promise<void>;
  toggleBookmark: (courseId: number) => Promise<void>;
  setSearchQuery: (query: string) => void;
  getCourseById: (id: number) => Course | undefined;
  loadBookmarks: () => Promise<void>;
  loadCachedCourses: () => Promise<void>;
}

export const useCourseStore = create<CourseState>((set, get) => ({
  courses: [],
  bookmarkedIds: new Set(),
  searchQuery: '',
  isLoading: false,
  isRefreshing: false,
  error: null,
  isOfflineCached: false,

  filteredCourses: () => {
    const { courses, searchQuery } = get();
    if (!searchQuery.trim()) return courses;
    const q = searchQuery.toLowerCase();
    return courses.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.instructor.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q),
    );
  },

  bookmarkedCourses: () => {
    const { courses, bookmarkedIds } = get();
    return courses.filter((c) => bookmarkedIds.has(c.id));
  },

  getCourseById: (id) => get().courses.find((c) => c.id === id),

  // ── Load persisted bookmarks from AsyncStorage ────────────────────────────

  loadBookmarks: async () => {
    try {
      const stored = await AsyncStorage.getItem(BOOKMARKS_KEY);
      if (stored) {
        const ids: number[] = JSON.parse(stored);
        set({ bookmarkedIds: new Set(ids) });
      }
    } catch {
      // silently ignore
    }
  },

  // ── Load cached course list from AsyncStorage (offline fallback) ──────────

  loadCachedCourses: async () => {
    try {
      const cached = await AsyncStorage.getItem(COURSES_CACHE_KEY);
      if (cached) {
        const courses: Course[] = JSON.parse(cached);
        if (courses.length > 0) {
          set({ courses, isOfflineCached: true });
        }
      }
    } catch {
      // silently ignore
    }
  },

  // ── Fetch fresh course data from API, cache on success ───────────────────

  fetchCourses: async () => {
    if (get().isLoading) return;

    // If we have cached data, show it immediately while fetching
    if (get().courses.length === 0) {
      await get().loadCachedCourses();
    }

    set({ isLoading: true, error: null });
    try {
      const [productsRes, usersRes] = await Promise.all([
        publicApi.getRandomProducts(1, 20),
        publicApi.getRandomUsers(1, 20),
      ]);

      const products = productsRes.data.data.data;
      const users = usersRes.data.data.data;

      const courses: Course[] = products.map((product, index) =>
        mapToCourse(product, users[index % users.length]),
      );

      // Persist fresh data to AsyncStorage for offline use
      AsyncStorage.setItem(COURSES_CACHE_KEY, JSON.stringify(courses)).catch(() => {});

      set({ courses, isLoading: false, isOfflineCached: false, error: null });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load courses';
      // Keep showing cached data if available — just surface the error
      set({ error: message, isLoading: false });
    }
  },

  refreshCourses: async () => {
    set({ isRefreshing: true, error: null });
    try {
      const [productsRes, usersRes] = await Promise.all([
        publicApi.getRandomProducts(1, 20),
        publicApi.getRandomUsers(1, 20),
      ]);

      const products = productsRes.data.data.data;
      const users = usersRes.data.data.data;

      const courses: Course[] = products.map((product, index) =>
        mapToCourse(product, users[index % users.length]),
      );

      // Update cache
      AsyncStorage.setItem(COURSES_CACHE_KEY, JSON.stringify(courses)).catch(() => {});

      set({ courses, isRefreshing: false, isOfflineCached: false, error: null });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to refresh courses';
      set({ error: message, isRefreshing: false });
    }
  },

  toggleBookmark: async (courseId) => {
    const { bookmarkedIds } = get();
    const next = new Set(bookmarkedIds);
    const isAdding = !next.has(courseId);

    if (isAdding) {
      next.add(courseId);
    } else {
      next.delete(courseId);
    }

    set({ bookmarkedIds: next });

    try {
      await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify([...next]));
      if (isAdding) {
        checkBookmarkMilestone(next.size); // intentionally not awaited
      }
    } catch {
      // Revert on storage failure
      set({ bookmarkedIds });
    }
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
}));
