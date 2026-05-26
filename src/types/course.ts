// ─── Raw API shapes ──────────────────────────────────────────────────────────

export interface RawProduct {
  id: number;
  title: string;
  description: string;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  brand: string;
  category: string;
  thumbnail: string;
  images: string[];
}

export interface RawUser {
  id: number;
  gender: string;
  name: { title: string; first: string; last: string };
  email: string;
  location: { city: string; country: string };
  picture: { large: string; medium: string; thumbnail: string };
  login: { uuid: string; username: string };
  dob: { age: number };
}

export interface PaginatedResponse<T> {
  page: number;
  limit: number;
  totalPages: number;
  totalItems: number;
  nextPage: boolean;
  previousPage: boolean;
  data: T[];
}

// ─── App-level course type ────────────────────────────────────────────────────

export interface Instructor {
  id: number;
  name: string;
  avatar: string;
  location: string;
}

export interface Course {
  id: number;
  title: string;
  description: string;
  /** Duration in hours (derived from price) */
  durationHours: number;
  /** Original price — used for display only */
  price: number;
  rating: number;
  category: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  thumbnail: string;
  images: string[];
  brand: string;
  instructor: Instructor;
}
