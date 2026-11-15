# FOCUS FLOW 4.0 — Reliability & Feature Roadmap

This roadmap prioritizes reliable everyday use over adding decorative screens. Items are proposals until implemented and verified.

## Delivered in the PDF Library update
- Search saved PDFs by file name.
- Sort by recently added, oldest first, name A–Z, and largest first.
- Show matching/total document counts and total stored size.
- Rename a saved PDF; invalid filename characters are replaced and the .pdf extension is preserved.
- Keep Open and Delete actions available in the local IndexedDB library.
- Use compact mobile-first controls.
- Identify saved PDFs by stable Library ID for reading progress and bookmarks, so renaming or same-name files do not collide.
- Open recent PDFs directly from the Home screen.
- Confirm destructive PDF deletion and clean up associated recent/progress/bookmark metadata.

### Implemented in Data Safety 2.0
- Versioned JSON backup envelope with an integrity checksum and export read-back verification.
- Restore preview with subject/session/task/plan/note counts, record sanity checks, duplicate subject-ID detection, and a confirmation step.
- Backward compatibility for legacy version-4 JSON backups.
- Settings storage health panel for localStorage, IndexedDB, estimated browser storage usage, and persistent-storage protection state.
- User-triggered request for persistent browser storage protection.
- Regression tests covering valid backups, modified payloads, legacy backups, unsupported versions, malformed collections, and duplicate subject IDs.
- Explicitly excludes the separate IndexedDB PDF Library from the study-data backup; PDF-library backup remains future work.

## P0 — Reliability and data safety
1. Add an app-wide data health screen: local storage availability, IndexedDB availability, estimated usage, last successful backup, and recovery state.
2. Add a validated backup restore preview showing counts for subjects, sessions, tasks, notes, and plans before replacing current data.
3. Add an explicit export-and-verify flow; never display a success state until the written file or stored record is confirmed.
4. Add crash/reload recovery tests for active focus sessions and prevent duplicate session records.
5. Add a PDF Library integrity check for missing blobs, invalid metadata, and storage quota failures.

## P1 — PDF Studio
1. Persist PDF reading position by stable library document ID rather than file name.
2. Make Home recent-document rows open the selected PDF directly.
3. Add multi-select PDF deletion and export/share of a saved PDF.
4. Add reader page-range navigation and a continuous-scroll mode with virtualized page rendering.
5. Add page-level annotation persistence and undo/redo before expanding annotation tools.
6. Add file-size warnings and adaptive rendering for low-memory Android devices.
7. Add clear, actionable errors for encrypted, damaged, unsupported, or oversized documents.
8. Add OCR only after an offline Bangla + English OCR engine and language data are packaged and tested.

## P1 — Study workflow
1. Add task subtask progress percentage and clear completed/overdue filters.
2. Add calendar date-specific study blocks, not only weekday templates.
3. Add reminder scheduling with Android notification permission and battery-optimization guidance.
4. Add subject-level goals and planned-versus-actual time comparisons.
5. Add session history editing with confirmation and audit-safe persistence.

## P2 — Dashboard and reporting
1. Add selectable date ranges and chart drill-down.
2. Add weekly/monthly report export to PDF and CSV.
3. Add subject distribution, focus consistency, task completion, and planned-versus-actual charts.
4. Add accessible chart summaries for screen readers and users who cannot interpret color-only information.

## P0 — Verification gates
Before calling a release ready:
- npm test
- npm run build
- Python tooling tests and project health audit
- Android Gradle debug APK build
- Install and test on a physical Android device
- Test PDF open from Files, multi-photo selection, save-as, in-app library reopen, rename, search, sort, delete, and large-file failure handling
- Test app restart, background timer recovery, and backup/restore
- Record the exact commit SHA and workflow run result

## Known limits that must remain explicit
- OCR, password security, digital-signature verification, PDF repair, DOCX conversion, and full editing of existing PDF text are not available unless their engines are integrated and tested.
- The PDF reader is not yet a continuous-scroll virtualized reader.
- A successful source-code commit is not proof of an Android APK build or physical-device verification.


## Delivered in the 4.0.1 whole-app reliability pass
- Reduced the focus timer's UI render frequency to one update per second; elapsed time remains wall-clock based and is not dependent on interval accuracy.
- Stop timer rendering when the timer screen exits or the session finishes.
- Freeze the complete Black Hole scene animation while paused.
- Limit photo-to-PDF batches to 20 images and resize large source images to a 2400 px maximum edge before JPEG encoding to reduce peak canvas memory.
- Make PDF save destinations explicit. A PDF save failure is surfaced unless an in-app library copy, Android Save As copy, or browser download has actually been created.
- Show the actual PDF export destination in the PDF Studio status message.

## Still requires physical Android verification
- Vivo Y29 / Android 15: install the generated APK and test background timer, notification permission, Back/Exit behavior, photo picker, PDF open/save and app restart.
- Large multi-photo PDF creation should be exercised with 10–20 high-resolution photos and monitored for memory pressure.
- Battery saver and OEM background restrictions can vary by device; CI cannot prove long-running background reliability.


## Delivered — Focus Flow 5.0.0 app-wide evolution
- Task and sub-task search added alongside existing status filters.
- Fixed task parent/sub-task completion reconciliation during normalization and final sub-task deletion.
- Fixed last-subject deletion persistence across app restart.
- Strengthened backup validation for plan lists, plan references and task sub-task records.
- Added keyboard-accessible confirmation and text dialogs: Escape handling, focus containment, accessible dialog labels and focus restoration.
- Theme changes now reflect only persisted settings; failed writes restore the previous visual state.
- Android multi-photo selection now rejects oversized combined data-URL batches before the full batch is retained.
- Native foreground timer plugin now rejects start/stop failures rather than silently resolving.
- IndexedDB PDF Library now handles blocked opens and closes connections on version changes.
- Versioned the offline shell cache and bumped app package/backup metadata to 5.0.0.

## Verification status
- Automated JS and Python tests, production web build, Android Gradle APK build, and project-health report are checked through GitHub Actions for the exact release commit.
- No physical Android device was available to this workflow; device-specific notification, gallery, PDF and background-resume behavior remains unverified.


## Delivered — Focus Flow 5.1.0
- Added portable PDF Library JSON backup export and validated merge-restore, using Android's system Save As picker for backup files. Restore checks format/version, document count, unique backup IDs, base64 data, PDF header, exact byte sizes and 20 MB total source size. Existing documents are never cleared.
- PDF Library transactions now correctly return null for missing document lookups instead of leaking an IDBRequest object.
- Reduced PDF source file limit to 75 MB, PDF.js image decoding to 8 million pixels, page canvas memory to 6 million output pixels, and thumbnail generation to 18 pages to control Android WebView memory.
- Android timer notification permission is requested only when starting a new focus session, not on pause/resume.
- Native foreground timer uses persisted validated state on process recreation, synchronously commits state snapshots, sanitizes subject text and relies on the system notification chronometer instead of a polling wake lock.
- Updated service worker shell cache to v8 and Android artifact naming to focus-flow-5.1-debug-apk.

## Verification requirements for 5.1
- CI can validate JS/Python tests, Vite build, Gradle compile and APK artifact creation.
- Vivo Y29 / Android 15 must still be tested manually for timer process-kill recovery, notification permission denied/granted states, app swipe-away, battery saver, PDF backup export/import, and large PDF/photo memory behavior.
- No battery-optimization exemption is requested; the service does not run a periodic wake-up loop.
