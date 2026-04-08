# TraceMap MVP - Design Specification

**Date:** 2026-03-18  
**Phase:** Phase 1 (MVP)  
**Status:** Draft

---

## Overview

**Goal:** Build a working MVP where users can import GPX files, view traces on an interactive map with date filtering, and see detailed activity stats with charts.

**Approach:** Vertical Slice Architecture - 4 slices delivering end-to-end user journeys.

**Core Value:** TraceMap places the map at the center of the experience. Every activity becomes a visual interactive work, not just statistics.

---

## Architecture

### Tech Stack

| Layer | Technology | Justification |
|-------|------------|---------------|
| Framework | **Expo (React Native)** | Build iOS/Android unified, compatible MapLibre via dev client |
| Map | **MapLibre GL Native** | Open source, free, supports 3D terrain tiles, high performance |
| Backend | **Supabase** | PostgreSQL + PostGIS for geometries, built-in Auth, Storage for GPX files |
| Auth | **Email/Password + Google OAuth** | Supabase Auth with Google provider |
| State | **Zustand** | Lightweight, simple, perfect for map and session state |
| Charts | **victory-native** | Full-featured, good animations, native performance |
| GPX Parsing | **fast-xml-parser** | Custom parsing logic, full control over GPX interpretation |
| Testing | **Jest + React Native Testing Library** | Full test coverage on critical paths |

### UI Color Scheme

**Primary colors (orange and white theme):**
- Primary orange: `#F97316`
- Light orange: `#FB923C`
- Dark orange: `#EA580C`
- White: `#FFFFFF`
- Off-white (backgrounds): `#F9FAFB`
- Light gray (borders): `#E5E7EB`
- Dark gray (text): `#1F2937`

**Heart rate zones:**
- Zone 1 (50-60%): Gray `#9CA3AF`
- Zone 2 (60-70%): Light blue `#60A5FA`
- Zone 3 (70-80%): Green `#10B981`
- Zone 4 (80-90%): Yellow-orange `#F59E0B`
- Zone 5 (90-100%): Red `#EF4444`

**Trace altitude gradient:**
- Low altitude: Blue `#3B82F6`
- Medium altitude: Orange `#F97316`
- High altitude: Red `#EF4444`

### Project Structure

```
src/
├── app/                        # Expo Router (file-based navigation)
│   ├── (auth)/
│   │   ├── sign-in.tsx         # Email/password sign in
│   │   └── sign-up.tsx         # Email/password sign up
│   ├── (tabs)/
│   │   ├── index.tsx           # Main map screen
│   │   └── activities.tsx      # Activity list
│   ├── activity/
│   │   └── [id].tsx            # Activity detail screen
│   └── _layout.tsx             # Root layout with providers
├── components/
│   ├── map/
│   │   ├── TerrainMap.tsx      # MapLibre wrapper with terrain
│   │   └── TraceLayer.tsx      # GeoJSON source + line layer
│   ├── activity/
│   │   ├── ActivityDetail.tsx  # Main detail screen
│   │   ├── StatsBar.tsx        # Horizontal stats strip
│   │   └── ElevationChart.tsx  # Victory elevation profile
│   ├── auth/
│   │   ├── SignInForm.tsx      # Email/password form
│   │   └── GoogleSignInButton.tsx
│   └── ui/
│       ├── ErrorBoundary.tsx
│       ├── ErrorToast.tsx
│       └── LoadingSpinner.tsx
├── services/
│   ├── supabase.ts             # Supabase client config
│   ├── activities.ts           # CRUD operations
│   └── gpxParser.ts            # GPX → GeoJSON + stats
├── stores/
│   ├── sessionStore.ts         # Auth state (user, session)
│   └── mapStore.ts             # Map viewport, selected activity, date range
├── hooks/
│   ├── useActivity.ts          # Fetch activity detail
│   └── useActivities.ts        # Fetch activities list
└── utils/
    ├── geo.ts                  # Distance, bbox, simplification
    └── colors.ts               # Altitude-based color gradients
```

---

## Data Model

### Database Schema (PostgreSQL + PostGIS)

```sql
-- Main activities table
CREATE TABLE activities (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users NOT NULL,
  title         TEXT,
  type          TEXT CHECK (type IN ('run', 'ride', 'hike', 'other')),
  started_at    TIMESTAMPTZ NOT NULL,
  duration_s    INTEGER NOT NULL,
  distance_m    FLOAT NOT NULL,
  elevation_m   FLOAT,
  avg_speed_ms  FLOAT,                     -- Stored (denormalized for performance)
  avg_hr        INTEGER,
  trace         GEOMETRY(LineStringZ, 4326),
  bbox          GEOMETRY(Polygon, 4326),
  raw_file_path TEXT,
  source        TEXT CHECK (source IN ('garmin', 'gpx_import')),
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Detailed points for charts and replay
CREATE TABLE activity_points (
  id          BIGSERIAL PRIMARY KEY,
  activity_id UUID REFERENCES activities ON DELETE CASCADE,
  seq         INTEGER NOT NULL,
  lat         FLOAT NOT NULL,
  lng         FLOAT NOT NULL,
  altitude_m  FLOAT,
  speed_ms    FLOAT,
  heart_rate  INTEGER,
  timestamp   TIMESTAMPTZ NOT NULL
);

-- Indexes
CREATE INDEX activities_user_idx ON activities (user_id);
CREATE INDEX activities_started_at_idx ON activities (started_at);
CREATE INDEX activity_points_activity_idx ON activity_points (activity_id, seq);
```

### Row Level Security (RLS)

```sql
-- Users can only access their own activities
CREATE POLICY "Users can view own activities"
  ON activities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activities"
  ON activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own activities"
  ON activities FOR DELETE
  USING (auth.uid() = user_id);

-- Activity points inherit access control from parent activity
CREATE POLICY "Users can view own activity points"
  ON activity_points FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM activities
      WHERE activities.id = activity_points.activity_id
      AND activities.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own activity points"
  ON activity_points FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM activities
      WHERE activities.id = activity_points.activity_id
      AND activities.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own activity points"
  ON activity_points FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM activities
      WHERE activities.id = activity_points.activity_id
      AND activities.user_id = auth.uid()
    )
  );
```

### Zustand Stores

```typescript
// sessionStore.ts
interface SessionState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

// mapStore.ts
interface MapState {
  viewport: {
    lat: number;
    lng: number;
    zoom: number;
    pitch: number;
    bearing: number;
  };
  selectedActivityId: string | null;
  dateRange: {
    start: Date;
    end: Date;
  };
  setViewport: (viewport: Partial<MapState['viewport']>) => void;
  setSelectedActivity: (id: string | null) => void;
  setDateRange: (range: { start: Date; end: Date }) => void;
}
```

---

## Vertical Slices

### Slice 1: Import → Map

**Goal:** User can import a GPX file and see it displayed on a MapLibre map. No auth, no persistence.

**GPX Import Mechanism:**
- **File picker only** - User taps a floating "Import GPX" button on the map screen
- Opens native file picker (Expo DocumentPicker)
- User selects `.gpx` file from device storage
- File is parsed immediately, trace displayed on map
- **File size limit:** 50MB maximum (triggers `FILE_TOO_LARGE` error if exceeded)

**Components:**
- `app/index.tsx` - Main map screen (full-screen MapLibre)
- `components/map/TerrainMap.tsx` - MapLibre wrapper with terrain tiles
- `components/map/TraceLayer.tsx` - GeoJSON source + line layer for GPX trace
- `components/ui/ImportButton.tsx` - Floating action button to trigger file picker
- `services/gpxParser.ts` - Parse GPX → GeoJSON + stats
- `stores/mapStore.ts` - Viewport state (no auth yet)

**GPX Parsing Output:**
```typescript
interface ParsedActivity {
  trace: GeoJSON.LineString;
  stats: {
    distance_m: number;
    elevation_m: number;
    duration_s: number;
    avg_speed_ms: number;
    started_at: Date;
    type: 'run' | 'ride' | 'hike' | 'other';
  };
  points: Array<{
    lat: number;
    lng: number;
    altitude_m: number;
    timestamp: Date;
  }>;
}
```

**Tests:**
- `gpxParser.test.ts` - Parse valid GPX, GPX without elevation, GPX without timestamps
- `TraceLayer.test.tsx` - Renders trace, applies altitude gradient

---

### Slice 2: Map → Detail

**Goal:** User can tap a trace and see full activity details with stats and charts.

**Data Flow (pre-Slice 3 persistence):**
- Slice 2 stores parsed GPX data in `mapStore` (in-memory Zustand store)
- When user taps a trace, `selectedActivityId` is set in the store
- Navigation to `/activity/[id]` reads from the store
- **Note:** This in-memory approach is intentional for Slice 2. Slice 3 will refactor to use Supabase persistence, but the component interfaces remain the same.

**Components:**
- `app/index.tsx` - Map screen with tap handling
- `app/activity/[id].tsx` - Activity detail screen
- `components/activity/ActivityDetail.tsx` - Main detail component
- `components/activity/StatsBar.tsx` - Horizontal stats strip
- `components/activity/ElevationChart.tsx` - Victory elevation profile
- `hooks/useActivity.ts` - Fetch from mapStore (in-memory for Slice 2, Supabase for Slice 3)

**Stats Displayed:**
- Distance (km/mi)
- Duration (h:mm:ss)
- Elevation gain (m/ft)
- Average speed (km/h or min/km pace)
- Average heart rate (bpm, if available)
- Date & time
- **Elevation profile chart** (Victory line chart)
- **Speed chart** (Victory line chart over time)
- **Heart rate zones** (Victory bar chart with following zones and colors):
  - Zone 1 (50-60%): Gray `#9CA3AF`
  - Zone 2 (60-70%): Light blue `#60A5FA`
  - Zone 3 (70-80%): Green `#10B981`
  - Zone 4 (80-90%): Yellow-orange `#F59E0B`
  - Zone 5 (90-100%): Red `#EF4444`

**Tests:**
- `ActivityDetail.test.tsx` - Renders all stats, elevation chart min/max, speed interpolation, HR zones
- `useActivity.test.ts` - Returns from cache, returns null if not found

---

### Slice 3: Auth + Persistence

**Goal:** Add Supabase authentication and persist activities to database.

**Prerequisites:**
- **Supabase Project:** Create project at supabase.com, note project URL and anon key
- **Google OAuth Setup:**
  1. Create Google Cloud project
  2. Enable Google+ API
  3. Create OAuth 2.0 credentials (Web application type)
  4. Add authorized redirect URI: `https://[YOUR_SUPABASE_PROJECT_ID].supabase.co/auth/v1/callback`
  5. Enable Google sign-in in Supabase Dashboard → Authentication → Providers → Google
  6. Paste Google Client ID and Secret into Supabase

**Components:**
- `app/(auth)/sign-in.tsx` - Email/password sign in
- `app/(auth)/sign-up.tsx` - Email/password sign up
- `app/(tabs)/index.tsx` - Map screen (auth-protected)
- `app/(tabs)/activities.tsx` - Activity list
- `components/auth/SignInForm.tsx` - Email/password form
- `components/auth/GoogleSignInButton.tsx` - Google OAuth
- `services/supabase.ts` - Supabase client config
- `services/activities.ts` - CRUD operations
- `stores/sessionStore.ts` - Auth state management

**Auth Flow:**
```typescript
// sessionStore.ts operations
signIn(email, password)     // Email/password authentication
signInWithGoogle()          // Google OAuth redirect flow
signUp(email, password)     // Create new account
signOut()                   // Clear session
```

**Database Operations:**
```typescript
createActivity(activity, userId)     // Insert activity + points
getActivities(userId, dateRange?)    // Fetch user's activities
getActivityById(activityId)          // Fetch single activity detail
```

**Tests:**
- `sessionStore.test.ts` - Valid/invalid credentials, Google OAuth, sign out
- `activities.test.ts` - Create, fetch with/without date range
- RLS policy tests - User isolation verification

---

### Slice 4: Polish + Tests

**Goal:** Add date filtering, error handling, and complete full test coverage.

**Date Filtering:**
```typescript
interface DateRangeFilter {
  preset: 'last_7_days' | 'last_30_days' | 'last_90_days' | 'all_time' | 'custom';
  customRange?: { start: Date; end: Date };
}

// Applied to activities query
const activities = await getActivities(userId, {
  start: dateRange.start,
  end: dateRange.end
});
```

**Error Handling:**
```typescript
enum ActivityError {
  GPX_PARSE_ERROR = 'GPX_PARSE_ERROR',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTH_ERROR = 'AUTH_ERROR',
  NOT_FOUND = 'NOT_FOUND',
}
```

**Test Coverage:**

| Category | Files |
|----------|-------|
| **Unit tests** | All services, utils, stores |
| **Component tests** | All UI components (rendering + interactions) |
| **Integration tests** | GPX import → parse → display flow |
| **E2E tests** | Auth flow, full activity import journey |

**Test Files:**
```
src/
├── app/
│   ├── index.test.tsx
│   └── activity/[id].test.tsx
├── components/
│   ├── map/
│   │   ├── TerrainMap.test.tsx
│   │   └── TraceLayer.test.tsx
│   ├── activity/
│   │   ├── ActivityDetail.test.tsx
│   │   └── StatsBar.test.tsx
│   └── auth/
│       ├── SignInForm.test.tsx
│       └── GoogleSignInButton.test.tsx
├── services/
│   ├── gpxParser.test.ts
│   ├── activities.test.ts
│   └── supabase.test.ts
├── stores/
│   ├── sessionStore.test.ts
│   └── mapStore.test.ts
├── hooks/
│   ├── useActivity.test.ts
│   └── useActivities.test.ts
└── utils/
    └── geo.test.ts
```

---

## User Flow

```
Onboarding
  └── Sign up / Sign in (email or Google)
      └── Import GPX file (file picker)
          └── Map screen (all traces visible, filtered by date)
              ├── Tap trace
              │     └── Activity detail
              │           ├── Stats (distance, elevation, duration, speed, HR)
              │           ├── Elevation profile chart
              │           ├── Speed chart
              │           └── Heart rate zones chart
              └── Tab "Activities" → List view
```

---

## Performance Considerations

- **GPX Simplification:** Ramer-Douglas-Peucker algorithm for map display (tolerance based on zoom)
- **Pagination:** Load activities in batches of 20, infinite scroll
- **Replay:** Down-sample to 1 point/second max, client-side interpolation
- **PostGIS:** Use `ST_Simplify` server-side for global map queries
- **MapLibre:** GeoJSON injected as source (no custom tiles for MVP)

---

## Security

- **Row Level Security (RLS):** Every user accesses only their own data
- **GPX Files:** Stored in private Supabase Storage bucket
- **Tokens:** Stored in Expo SecureStore (not AsyncStorage)
- **No Analytics:** No third-party tracking on activity data

---

## Out of Scope (Phase 2+)

- Relief 2.5D extrusion (Phase 2)
- Animated replay (Phase 2)
- Garmin Connect sync (Phase 3)
- Heatmap visualization (Phase 4)
- Advanced statistics calendar (Phase 4)

---

## Success Criteria

MVP is complete when:
- [ ] User can sign up/in with email or Google
- [ ] User can import a GPX file (up to 50MB)
- [ ] Imported trace appears on the map
- [ ] User can tap trace to see detail screen
- [ ] Detail shows all stats + 3 charts (elevation, speed, HR zones)
- [ ] Date filtering works (last 7/30/90 days, all time, custom)
- [ ] All tests pass (see "Critical Paths" definition below)
- [ ] Error handling graceful (no crashes)

**Critical Paths (required test coverage):**
1. **Auth flow** - Sign up, sign in, Google OAuth, sign out, session persistence
2. **GPX import** - File picker, parsing valid GPX, error handling (invalid file, too large)
3. **Map display** - Map renders, trace displays, tap handling, viewport persistence
4. **Activity detail** - All stats render correctly, all 3 charts render with correct data
5. **Data persistence** - Create activity, fetch activities, RLS isolation verified
6. **Date filtering** - Filter by preset ranges, custom range, empty results handled
