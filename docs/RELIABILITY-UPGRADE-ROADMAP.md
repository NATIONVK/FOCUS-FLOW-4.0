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


## Delivered — Focus Flow 5.2.0 stability hardening
- PDF backup export now checks declared Blob size and cumulative remaining capacity before materializing each file as an ArrayBuffer. This avoids loading a known-oversized PDF into memory before rejecting it.
- PDF backup export rejects missing/duplicate document IDs before producing a backup that would later fail restore validation, and verifies the declared Blob size against the bytes actually read.
- Added regression coverage for pre-allocation size rejection, duplicate/missing IDs, invalid base64, oversized backup files and empty-library backups.
- Corrected general app backup metadata to report 5.2.0 and advanced the offline shell cache to v9.
- Existing focus UI, timer behavior, PDF reader limits and data schema remain unchanged.

## 5.2 verification boundary
- GitHub Actions verifies source tests, Python build-tool tests, production web build, Android manifest preparation and APK compilation.
- Actual Vivo Y29 / Android 15 behavior remains a manual physical-device test. CI is not evidence of device-specific background process survival, OEM battery policy, photo picker behavior, or real-world RAM use.


## Delivered — Focus Flow 5.3.0 reliability hardening
- PDF Library restore now estimates each Base64 record's decoded byte size and rejects cumulative overflow before allocating the next document's decoded byte buffer.
- Added a regression test proving a later PDF is rejected before Base64 decoding when the cumulative restore budget is exhausted.
- Bumped app package and backup metadata to 5.3.0, advanced the offline shell cache to v10, and renamed the Android debug artifact for 5.3.

## 5.3 verification boundary
- GitHub Actions must pass JavaScript tests, Python tooling tests, production web build, Android manifest preparation and Gradle APK compilation for the exact PR commit.
- Physical Vivo Y29 / Android 15 installation, process-kill/reboot timer recovery, PDF Library quota stress, and real RAM/battery profiling remain manual device checks.


## Additional 5.3 PDF Library transaction hardening
- IndexedDB transaction callbacks that throw now explicitly abort the transaction, preventing partially applied multi-record restore operations from being committed.
- Database connections are closed when an open request succeeds after an earlier blocked-open rejection, avoiding a late-open connection leak.
- Transaction completion, error and abort handlers are installed before running write callbacks, and database handles are closed on every settled path.
- Automated CI still cannot simulate every OEM WebView/IndexedDB quota condition; device-level restore failure injection remains required.


## Additional 5.3 restore consistency and storage errors
- PDF backup restore now performs duplicate detection and inserts inside one IndexedDB read-write transaction. This prevents two overlapping restore attempts from both observing an absent backup ID and inserting duplicate copies.
- A failed multi-document write remains an atomic transaction: the database either commits the queued restore writes together or aborts them together.
- IndexedDB quota exhaustion and aborted/invalid-state operations now produce actionable user-facing errors instead of opaque browser exception names.
- These changes require CI verification and real WebView testing, especially under low free storage and concurrent restore attempts.

## Additional 5.3 PDF Library integrity audit
- Added a read-only PDF Library verification action that checks each saved record's ID/name, Blob readability, declared-versus-actual byte size, and PDF header.
- Detects duplicate backup IDs without deleting or modifying records.
- The Files tab reports healthy and damaged document counts and a short diagnostic summary; users decide what to delete or re-import.
- Integrity scan reads only the first 1 KB of each PDF for header validation rather than loading complete documents into memory.
- Automated regression coverage verifies healthy, damaged, missing-blob, size-mismatch, duplicate-ID and read-only behavior.

## Timer snapshot recovery hardening
- Restored active-session snapshots now reject timestamps implausibly far in the future, segment start times earlier than the original session start, unbounded accumulated durations, oversized subject IDs, and oversized session IDs.
- Invalid snapshots are discarded instead of producing a frozen or nonsensical timer display.
- Added regression coverage for malformed/future-dated timer snapshots. Valid legacy snapshots without a session ID remain supported.
- Android service still uses its persisted elapsed-time baseline and START_STICKY restart behavior; reboot/force-stop recovery and physical-device validation are not claimed by this change.


## Delivered — Focus Flow 5.5.0 reliability and offline recovery
- Added a bounded persistent last-known-good study-data snapshot. If the primary localStorage record is malformed or missing, startup validates and restores the previous snapshot, repairs the primary record when storage permits, and preserves the damaged source separately for diagnosis.
- The recovery snapshot is capped at 512 KiB to avoid unbounded localStorage duplication. Larger study datasets continue to rely on explicit verified exports rather than consuming excessive device storage.
- Normal saves verify the primary record before refreshing the recovery snapshot. If the recovery copy cannot be refreshed, the successfully saved primary record is retained and the stale snapshot is discarded.
- Android study-data backup now uses the native Storage Access Framework Save As picker. Native PDF and general-file exports verify the exact byte count reported by the Android bridge before the UI reports success.
- Bumped app and backup metadata to 5.5.0, Android APK artifact naming to 5.5.0, and the offline shell cache to v14.
- Expanded the project health audit to require the native command queue and dashboard/queue regression tests.
- AI/cloud APIs remain excluded; core workflows remain local and offline-first.

## 5.5 verification boundary
- CI must pass JavaScript tests, Python build-tool tests, project health audit, production Vite build, Android manifest/icon validation and Gradle debug APK compilation for the exact PR head.
- Automated tests cover recovery from malformed and missing primary storage records, including preservation of the damaged source and repair of the primary key.
- Native Save As byte-count confirmation must still be exercised on a physical Android device.
- Vivo Y29 / Android 15 installation, timer process-death recovery, gallery multi-select, PDF open/save, low-storage restore, battery use and RAM profiling remain manual device checks.


## Delivered — Focus Flow 5.5.1 PDF Library usability
- Added selection checkboxes, select-visible control, selected count, and bulk delete to the local PDF Library.
- Bulk delete uses one IndexedDB read-write transaction so the selected set is committed together or aborted together.
- Added per-document export to Android Save As with native byte-count verification; web builds use browser download.
- Deletion cleans associated recent-document, reading-progress and bookmark metadata.
- Bumped app and backup metadata to 5.5.1, shell cache to v15 and Android artifact name to focus-flow-5.5.1-debug-apk.

## 5.5.1 verification boundary
- Automated tests and CI build must pass for the exact commit.
- Android Save As cancellation, file visibility in Files, and bulk-delete interaction require physical-device testing.


## Delivered — Focus Flow 5.5.2 Professional PDF Reader
- Continuous vertical reading uses a bounded five-page canvas window; off-window pages are not retained as rendered canvases.
- Page navigation supports a comma-separated page range and jumps to the first page in the requested range while reporting the selected range count.
- Thumbnail canvases render lazily near the visible rail; the thumbnail list is capped at 300 pages for memory safety.
- Reading page and zoom are restored through validated bounds; zoom remains between 45% and 300%.
- Page canvas rasterization is capped at a four-million-pixel budget and a 1.5 device-pixel ratio.
- Added pure helper tests for page ranges, virtual windows, page clamping and progress restoration.

## 5.5.2 verification boundary
- Automated tests and Android Gradle build must pass for the exact branch head.
- Continuous scroll feel, large-file memory behavior, drawing overlay alignment and reading position across app process death still require physical Android device testing.


## Delivered — FOCUS FLOW 5.5.6 low-memory performance

- PDF canvas backing-store resolution now adapts to the browser's reported device-memory tier, with a conservative 4 GB fallback when the hint is unavailable.
- Canvas pixel budgets are capped at 0.9M / 1.4M / 1.8M / 2.4M pixels by memory tier, with corresponding DPR ratio caps. The CSS display size and PDF zoom remain unchanged; only backing-store resolution is reduced.
- Focus Timer's one-second UI refresh now runs only while the Focus Screen is visible and the timer is actively running. It stops on app backgrounding or when the session is paused, then resumes on return/unpause. Elapsed time continues to derive from timestamps and is not tied to the render interval.
- Added unit tests for device-memory tiers, fallback behavior and canvas pixel budget enforcement.
- Updated app/backup version metadata to 5.5.6, offline shell cache to v20 and Android artifact naming.

## 5.5.6 verification boundary

- CI must pass all regression tests, Python tooling checks, project health audit, production web build and Android debug APK build for the exact branch head.
- Browser device-memory hints are approximate and may be unavailable; the conservative fallback is used in that case.
- Physical Vivo Y29 / Android 15 battery, RAM, PDF readability and long-session checks remain manual gates.


## Delivered — Focus Flow 5.5.7 Android timer recovery hardening
- Pass the stable active-session ID through the Capacitor bridge to the native foreground timer service.
- Persist and restore that identity in Android service preferences alongside subject, elapsed-time base, epoch, and paused state.
- Keep the JS timer snapshot as the source of truth after WebView/app process recreation; startup restoration re-synchronizes the native notification using the same session identity.
- Add regression coverage that a restored JS timer retains its session ID, subject, elapsed time, and can finish without leaving an active snapshot.
- CI verifies source and build behavior; Android process-kill/restart and notification behavior still require physical-device testing.


## Delivered — Focus Flow 5.6.0 dashboard and Black Hole polish
- Add dashboard analytics periods for the last 7, 30, and 90 days, plus all-time history; selected periods update focus totals, session counts, subject distribution, and insights without changing the separate seven-day trend chart.
- Add regression coverage for local-calendar range boundaries and invalid timestamps.
- Add a lightweight photon precession ring and gravitational halo to the Black Hole scene; retain the timer-only center, pause-state behavior, and reduced-motion fallback.
- Advance package version to 5.6.0 and service-worker shell cache to v22.
- Automated CI and Android APK build are required before release; physical Android visual, pause, and performance checks remain manual gates.


## Delivered — Focus Flow 5.6.1 Black Hole progressive evolution
- Replace per-minute visual growth with discrete evolution stages every 210 seconds (3 minutes 30 seconds) of active focus time.
- Pause is respected automatically because evolution is derived from the timer's accumulated active elapsed time; resume continues from the same stage.
- Each stage increases scene scale, rotation speed, wave/beam/particle speed, photon-ring intensity, and gravitational glow; growth is capped at 28% and speed at 0.48x to keep the scene bounded on mobile.
- Add pure evolution calculation and boundary/cap regression tests; bump package and backup metadata to 5.6.1 and service-worker cache to v23.
