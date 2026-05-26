# LearnHub — Mini LMS Mobile App

A production-quality Learning Management System (LMS) built with **React Native Expo** as part of a technical assignment. Demonstrates native features, WebView integration, state management, and performance optimization.

---

## 📱 Screenshots

> Auth, Course Catalog, Course Detail, WebView Content, Profile

---

## 🚀 Features

### Part 1 — Authentication
- Login / Register via `https://api.freeapi.app/api/v1/users`
- Auth tokens stored in **Expo SecureStore**
- Auto-login on restart via token hydration
- Token refresh on 401 with queued request replay
- Avatar upload via camera roll

### Part 2 — Course Catalog
- Courses from `/public/randomproducts` + instructors from `/public/randomusers`
- Pull-to-refresh, search bar, All / Bookmarked filter tabs
- Bookmark toggle persisted to **AsyncStorage**
- Memoized `FlatList` with `getItemLayout`, `removeClippedSubviews`
- Course detail screen with full info, instructor card, star rating

### Part 3 — WebView Integration
- Local HTML template rendered in `WebView`
- **Native → WebView**: `injectedJavaScript` sends user session data on load
- **WebView → Native**: `postMessage` handles `ENROLL`, `BOOKMARK`, `QUIZ_START` actions
- Load progress bar, reload button, error recovery UI

### Part 4 — Local Notifications
- Notification permission request on first launch
- Milestone notifications at 5, 10, and 20 bookmarks (deduplicated via AsyncStorage)
- 24-hour inactivity reminder scheduled on app background, cancelled on foreground
- Android notification channels (`lms-general`, `lms-reminders`)
- Tap notification → navigate to Courses tab

### Part 5 — State Management
- **Zustand** for all state (`authStore`, `courseStore`, `appStore`, `networkStore`)
- Sensitive data (tokens) → **Expo SecureStore**
- Bookmarks + preferences → **AsyncStorage** (via Zustand `persist` middleware)
- Granular per-field selectors to prevent unnecessary re-renders

### Part 6 — Error Handling
- Axios retry interceptor: 3 retries with exponential backoff (400ms × n)
- 10-second request timeout
- Offline mode amber banner via `@react-native-community/netinfo`
- WebView error state with "Try Again" reload button
- Normalized API error messages

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native + Expo SDK 56 |
| Language | TypeScript (strict mode) |
| Navigation | Expo Router (file-based) |
| State | Zustand |
| API | Axios + interceptors |
| Secure Storage | expo-secure-store |
| Async Storage | @react-native-async-storage/async-storage |
| Notifications | expo-notifications |
| WebView | react-native-webview |
| Images | expo-image (with disk+memory cache) |
| Icons | @expo/vector-icons (Ionicons) |
| Network | @react-native-community/netinfo |

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Android Studio (for Android emulator) or a physical device

### Install & Run

```bash
# Clone the repo
git clone <repo-url>
cd LMS

# Install dependencies
npm install

# Run on Android (development build)
npx expo run:android

# Run on iOS (development build)
npx expo run:ios

# Start Metro bundler only (requires existing development build)
npx expo start
```

> **Note**: This app uses `expo-notifications` which requires a **development build** (not Expo Go) on Android due to SDK 53+ restrictions on push notification APIs.

### Environment Variables

No `.env` file is required. The API base URL is configured directly in `src/services/api.ts`:

```ts
const BASE_URL = 'https://api.freeapi.app/api/v1';
```

---

## 📁 Project Structure

```
src/
├── app/                    # Expo Router screens
│   ├── (auth)/             # Login, Register, Forgot Password
│   ├── (main)/             # Home, Courses, Profile tabs
│   ├── course/[id].tsx     # Course detail screen
│   ├── course-content/[id].tsx  # WebView content screen
│   └── _layout.tsx         # Root layout (notifications, network)
├── assets/
│   └── courseHtmlTemplate.ts   # HTML template for WebView
├── components/
│   ├── CourseCard.tsx      # Memoized course list item
│   ├── OfflineBanner.tsx   # Network status banner
│   └── ui/                 # Avatar, Button, Input, SearchBar, LoadingOverlay
├── constants/
│   └── theme.ts            # Design tokens (colors, spacing, typography)
├── services/
│   ├── api.ts              # Axios instance, interceptors, endpoints
│   └── notifications.ts    # Local notification service
├── store/
│   ├── authStore.ts        # Authentication state
│   ├── courseStore.ts      # Courses + bookmarks
│   ├── appStore.ts         # Preferences + onboarding
│   └── networkStore.ts     # Network connectivity
└── types/
    ├── auth.ts             # Auth type definitions
    └── course.ts           # Course type definitions
```

---

## 🏗️ Key Architectural Decisions

### 1. Zustand over Redux
Minimal boilerplate, no `Provider` wrapper, excellent TypeScript inference, and built-in `persist` middleware for AsyncStorage.

### 2. Granular Zustand Selectors
Each component subscribes to exactly the slice it needs (`useCourseStore((s) => s.courses)`) rather than the whole store object. This prevents re-renders when unrelated state changes.

### 3. Single Source of Truth for Bookmarks
Bookmarks live exclusively in `courseStore` (AsyncStorage). `appStore` manages only preferences and onboarding flags.

### 4. expo-notifications Sub-module Import
To avoid the Expo Go Android crash (`expo-notifications` SDK 53+ blocks remote push registration), notifications are loaded via specific internal sub-module `require()` calls wrapped in `try/catch`. This allows local notifications to work in both Expo Go (iOS) and development builds (Android).

### 5. WebView Communication Pattern
- **Native → WebView**: `injectedJavaScript` runs on page load and injects `window.COURSE_DATA` with user session info, dispatching a `NativeReady` custom event.
- **WebView → Native**: HTML buttons call `window.ReactNativeWebView.postMessage(JSON.stringify({ type, courseId }))`, handled by `onMessage`.

### 6. Retry Interceptor Design
The retry interceptor fires **before** the 401 handler. Only network errors (no response) and 5xx server errors are retried. 4xx client errors and 401s are handled by their specific logic paths.

---

## ⚠️ Known Issues / Limitations

1. **Notifications on Android require a development build** — `expo-notifications` dropped Expo Go support in SDK 53+. Run `npx expo run:android` to get full notification support.
2. **Enroll Now** — enrollment is simulated (Alert confirmation + navigate to content). There is no enrollment API in `api.freeapi.app`.
3. **Course progress** — "Completed" count is hardcoded to 0. No completion-tracking API is available.
4. **WebView content** — Course content is rendered from a local HTML template, not a remote URL, since the assignment doesn't provide a real course content API.

---

## 📦 APK Build

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build APK (development build)
eas build --platform android --profile development
```

APK is available in the [Releases](../../releases) section.
