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
