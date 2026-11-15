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
