# FOCUS FLOW 5.3

Your personal study OS. Focus deeper. Learn smarter. Grow daily.

## Latest update · 5.3.0
- Removed the document/PDF workspace, navigation, UI, storage, native picker/export bridge, dedicated tests and third-party libraries.
- Kept study-data backup and restore independent for subjects, sessions, tasks, plans, notes and settings.
- Removed unused Android media-library permissions and native gallery registration.
- Preserved the focus timer, Black Hole and other timer themes, dashboard, analytics, tasks, planner, notes, history and offline-first app shell.

## Core features
- Focus timer with persistent Android notification support.
- Black Hole, Atomic System, Spiral Galaxy, Binary Star and Blue Particle Heart environments.
- Customizable dashboard, progress summaries and productivity insights.
- Subjects, tasks with subtasks, weekly study planner and notes.
- Study history, statistics and verified JSON backup/restore.

## Run locally
```bash
npm install
npm run dev
npm test
npm run build
```

## Android APK
Push to `main` or manually run **Build Android APK** in GitHub Actions. The workflow runs tests, builds the web app, synchronizes Capacitor and creates a debug APK artifact.

## Project structure
- `src/main.js` — app navigation, screens and interactions.
- `src/store.js` — validated local study data and persistence.
- `src/timer.js` — focus session state.
- `src/analytics.js` and `src/productivity-intelligence.js` — study metrics and insights.
- `src/data-safety.js` — verified study-data backup, restore and storage health.
- `src/blackhole-focus.js` and related styles — focus scene settings and effects.
- `native/android/` — Android focus timer bridge and foreground service.

## Safety
Study records remain local to this device. Export a verified backup before reinstalling or clearing app data. Restore validates a selected backup before replacing current study records.
