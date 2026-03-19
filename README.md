# 🗺️ TraceMap

**Visualize your adventures in 3D**

[![License: MIT](https://img.shields.io/badge/License-MIT-orange.svg)](https://opensource.org/licenses/MIT)
[![Expo](https://img.shields.io/badge/Expo-000020?style=flat&logo=expo&logoColor=white)](https://expo.dev/)
[![React Native](https://img.shields.io/badge/React_Native-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com/)

> **TraceMap** is a personal activity tracking app for runners and cyclists. Unlike Strava, TraceMap focuses on **stunning map visualizations** — every activity becomes a visual masterpiece.

---

## ✨ Features

### 🎨 Beautiful Map Visualizations
- **Multi-activity display** — See all your routes overlaid on a single map
- **Color-coded traces** — Each activity gets a unique color for easy distinction
- **Interactive map** — Pinch, zoom, rotate, and explore your adventures

### 📊 Activity Analytics
- **Detailed stats** — Distance, elevation gain, duration, average speed, heart rate
- **Elevation profile** — Visualize climbs and descents
- **Speed analysis** — Track your pace throughout the activity
- **Heart rate zones** — See your training intensity distribution
- **HR evolution** — Monitor heart rate changes over time

### 📁 GPX Import
- **Universal format** — Import any `.gpx` file from Garmin, Strava, Komoot, etc.
- **Garmin HR support** — Full heart rate data from `<ns3:hr>` tags
- **Fast parsing** — Optimized to handle large activities (5000+ points)

### 🔐 Privacy First
- **100% personal** — No social network, no data sharing
- **Secure storage** — Supabase Row Level Security (RLS)
- **Local authentication** — Email/password + Google OAuth

### ⚡ Performance Optimized
- **Smart simplification** — Large traces automatically optimized for smooth rendering
- **Lazy loading** — Activities load progressively to prevent blocking
- **Offline-ready** — Map tiles cached for offline viewing

---

## 📱 Screenshots

<div align="center">
  <table>
    <tr>
      <td align="center">
        <b>🗺️ Map View</b><br/>
        <i>All your activities at a glance</i>
      </td>
      <td align="center">
        <b>📈 Activity Detail</b><br/>
        <i>Comprehensive analytics</i>
      </td>
      <td align="center">
        <b>💓 HR Analysis</b><br/>
        <i>Training zones & evolution</i>
      </td>
    </tr>
    <tr>
      <td align="center">
        <img src="https://via.placeholder.com/200x400/F97316/FFFFFF?text=Map+View" alt="Map View" width="200"/>
      </td>
      <td align="center">
        <img src="https://via.placeholder.com/200x400/3B82F6/FFFFFF?text=Activity+Detail" alt="Activity Detail" width="200"/>
      </td>
      <td align="center">
        <img src="https://via.placeholder.com/200x400/10B981/FFFFFF?text=HR+Analysis" alt="HR Analysis" width="200"/>
      </td>
    </tr>
  </table>
  <p><i>Screenshots are illustrative — actual app may vary</i></p>
</div>

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Expo CLI** (`npm install -g expo-cli`)
- **Supabase account** ([Sign up free](https://supabase.com/))
- **MapTiler API key** ([Get free key](https://www.maptiler.com/))

### Installation

```bash
# Clone the repository
git clone https://github.com/Roromainn/TraceMap.git
cd TraceMap

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase URL, anon key, and MapTiler token

# Start the development server
npm start
```

### Supabase Setup

1. **Create a new project** at [supabase.com](https://supabase.com/)

2. **Run the SQL setup** (found in `supabase-setup.sql`):
   ```sql
   -- Creates tables: activities, activity_points
   -- Enables Row Level Security (RLS)
   -- Creates storage bucket: gpx-files
   ```

3. **Update `.env`** with your credentials:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   EXPO_PUBLIC_MAPTILER_TOKEN=your-maptiler-token
   ```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Framework** | [Expo](https://expo.dev/) + [React Native](https://reactnative.dev/) | Cross-platform mobile app |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | Type-safe development |
| **Maps** | [MapLibre GL](https://maplibre.org/) | Open-source vector maps |
| **Tiles** | [MapTiler](https://www.maptiler.com/) | Outdoor map style + terrain |
| **Backend** | [Supabase](https://supabase.com/) | PostgreSQL + Auth + Storage |
| **GIS** | [PostGIS](https://postgis.net/) | Spatial data storage |
| **State** | [Zustand](https://zustand-demo.pmnd.rs/) | Lightweight state management |
| **Data** | [TanStack Query](https://tanstack.com/query) | Caching + synchronization |
| **Charts** | [Victory Native](https://commerce.nearform.com/open-source/victory-native/) | Beautiful data visualizations |
| **Parsing** | `fast-xml-parser` | GPX file parsing |

---

## 📂 Project Structure

```
TraceMap/
├── src/
│   ├── app/                      # Expo Router (file-based routing)
│   │   ├── (tabs)/               # Main app tabs
│   │   │   ├── index.tsx         # Map screen
│   │   │   ├── activities.tsx    # Activity list
│   │   │   └── settings.tsx      # Settings & units
│   │   ├── (auth)/               # Authentication screens
│   │   │   └── index.tsx         # Login/Signup
│   │   └── activity/[id].tsx     # Activity detail
│   │
│   ├── components/
│   │   ├── map/
│   │   │   ├── TerrainMap.tsx    # MapLibre wrapper
│   │   │   └── TraceLayer.tsx    # GPX trace rendering
│   │   ├── activity/
│   │   │   ├── StatsBar.tsx      # Distance, elevation, speed
│   │   │   ├── ElevationChart.tsx # Elevation profile
│   │   │   ├── SpeedChart.tsx    # Speed over time
│   │   │   ├── HRZonesChart.tsx  # HR zone distribution
│   │   │   └── HREvolutionChart.tsx # HR evolution
│   │   └── ui/
│   │       ├── ImportButton.tsx  # GPX file picker
│   │       └── Toast.tsx         # Notification system
│   │
│   ├── services/
│   │   ├── supabase.ts           # Supabase client
│   │   ├── gpxParser.ts          # GPX parsing (Garmin HR support)
│   │   └── activities.ts         # CRUD operations
│   │
│   ├── stores/
│   │   ├── mapStore.ts           # Map & activities state
│   │   └── settingsStore.ts      # User preferences
│   │
│   └── utils/
│       ├── colors.ts             # Color palette (orange theme)
│       ├── geo.ts                # Distance, bbox calculations
│       └── units.ts              # Speed unit conversion
│
├── docs/
│   └── superpowers/
│       ├── specs/                # Design specifications
│       └── plans/                # Implementation plans
│
├── .env.example                  # Environment template
├── supabase-setup.sql            # Database schema
└── package.json                  # Dependencies
```

---

## 📊 Database Schema

### `activities` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Owner (RLS enforced) |
| `title` | TEXT | Activity name |
| `type` | TEXT | `run`, `ride`, `hike`, `other` |
| `started_at` | TIMESTAMPTZ | Start time |
| `duration_s` | INTEGER | Duration in seconds |
| `distance_m` | FLOAT | Distance in meters |
| `elevation_m` | FLOAT | Elevation gain in meters |
| `avg_speed_ms` | FLOAT | Average speed (m/s) |
| `avg_hr` | INTEGER | Average heart rate (bpm) |
| `trace` | GEOMETRY(LineStringZ) | GPS track with elevation |
| `raw_file_path` | TEXT | Path to GPX file in Storage |

### `activity_points` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGSERIAL | Primary key |
| `activity_id` | UUID | Foreign key → activities |
| `seq` | INTEGER | Point order (for sorting) |
| `lat` | FLOAT | Latitude |
| `lng` | FLOAT | Longitude |
| `altitude_m` | FLOAT | Altitude in meters |
| `speed_ms` | FLOAT | Instantaneous speed (m/s) |
| `heart_rate` | INTEGER | Heart rate (bpm) |
| `timestamp` | TIMESTAMPTZ | Point timestamp |

---

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# MapTiler (for map tiles)
EXPO_PUBLIC_MAPTILER_TOKEN=your-maptiler-token

# Optional: Google OAuth (configure in Supabase Dashboard)
# EXPO_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
```

### Supported Units

TraceMap supports multiple unit systems (configurable in Settings):

| Type | Options |
|------|---------|
| **Speed** | min/km, km/h, min/mile, mph |
| **Distance** | km, miles |
| **Elevation** | meters, feet |

---

## 🎯 Roadmap

### ✅ Completed (v1.0)
- [x] GPX import & parsing
- [x] Multi-activity map display
- [x] Activity detail with charts
- [x] Supabase authentication
- [x] Data persistence
- [x] Heart rate analysis
- [x] Unit preferences

### 🚧 In Progress (v1.1)
- [ ] 3D terrain visualization
- [ ] Animated route replay
- [ ] Activity heatmap

### 📅 Planned (v1.2+)
- [ ] Garmin Connect sync
- [ ] Activity editing
- [ ] Export to GPX/TCX
- [ ] Calendar view
- [ ] Performance trends

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Development Guidelines

- **TypeScript** — All code must be typed
- **TDD** — Write tests first when possible
- **Performance** — Optimize for large activities (5000+ points)
- **Privacy** — Never share user data

---

## 📝 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

```
Copyright (c) 2026 TraceMap

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software...
```

---

## 🙏 Acknowledgments

- **[MapLibre](https://maplibre.org/)** — Open-source mapping library
- **[MapTiler](https://www.maptiler.com/)** — Beautiful map tiles
- **[Supabase](https://supabase.com/)** — Open-source Firebase alternative
- **[Expo](https://expo.dev/)** — React Native development platform
- **[Victory Native](https://commerce.nearform.com/open-source/victory-native/)** — Data visualization

---

## 📬 Contact

- **Project Link:** [https://github.com/Roromainn/TraceMap](https://github.com/Roromainn/TraceMap)
- **Issues:** [GitHub Issues](https://github.com/Roromainn/TraceMap/issues)

---

<div align="center">

**Made with ❤️ for runners and cyclists**

[⬆️ Back to top](#-tracemap)

</div>
