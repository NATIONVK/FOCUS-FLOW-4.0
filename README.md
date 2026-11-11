# FOCUS FLOW 4.0

A premium, offline-first study and focus tracker. Built with web technologies and packaged for Android with Capacitor.

## Stack
- HTML5, CSS3, JavaScript (ES modules)
- Capacitor Android bridge
- Local-first persistence with IndexedDB (localStorage fallback)
- Node.js built-in test runner
- GitHub Actions + Gradle for Android APK builds

## Features in this foundation
- Full-screen focus timer with pause/resume and recovery after reload
- Subject management and per-subject study totals
- Session history, daily/weekly/monthly summaries
- Tasks, notes, goals, theme and language preference
- Offline-capable app shell and local data export/import
- Gallery image-to-PDF maker: select multiple images, reorder pages, remove pages, choose A4/Letter/custom image-size, and export one PDF offline
- Automated unit tests and Android debug APK workflow

## Development
```bash
npm install
npm test
npm run build
npx cap add android
npx cap sync android
```

## Android
Push to `main` or manually run **Build Android APK** in Actions. The workflow builds a debug APK and uploads it as an artifact. A successful web build alone is not proof that the Android APK works; install and test the artifact on a device.

## Data
All study data stays on this device by default. Export a JSON backup regularly. Clearing app data or uninstalling without a backup can remove local records.

## Project status
FOCUS FLOW 4.0 is under active development. The automated tests cover core data and timer logic; device-specific behavior still requires Android installation testing.


### Direct Recent Photos to PDF
- Android native gallery grid loads recent device photos directly (newest first), with paginated loading and file browser fallback.
- Select multiple images, reorder by drag/drop or move controls, remove pages, and export a single offline PDF.
- Photo access is requested at runtime; Android 14+ can grant selected-photo access depending on user choice.
