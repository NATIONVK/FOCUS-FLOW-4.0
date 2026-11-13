# FOCUS FLOW 5.0 — Phase 0 Audit

## Repository baseline
- Repository: `NATIONVK/FOCUS-FLOW-4.0`
- Default branch: `main`
- App architecture: Vite + vanilla JavaScript + Capacitor 7
- Android application ID: `com.nationvk.focusflow`
- Existing core modules: Store, FocusTimer, Analytics, PDF Maker
- Native bridges: FocusTimer service/plugin and Gallery plugin
- Existing validation: Node test suite, Vite production build, Android APK GitHub Actions workflow

## Phase 0 findings
1. Local data parsing/validation errors previously fell back to empty defaults without preserving the raw value. This could make recoverable local data appear lost.
2. Timer completion depended directly on `crypto.randomUUID()`, unlike the store's existing fallback ID generator.
3. Timer restore/cleanup paths needed defensive handling around storage access.
4. Native timer service, notification permissions, gallery permissions and generated Android manifest need device-level verification; CI build success alone cannot prove OEM background reliability.
5. Existing data schema is version 4. Schema migration must be explicit and backward-compatible; do not rename the storage key or change the schema without migration tests.

## Phase 0 changes started
- Preserve a raw recovery snapshot under `focus-flow-v4-recovery` when stored data fails parsing or validation.
- Surface a warning when recovery data has been preserved.
- Add a fallback session ID for environments without `crypto.randomUUID()`.
- Harden timer restore and active-session cleanup.
- Add regression tests for the recovery and ID fallback paths.

## Remaining Phase 0 verification
- Run `npm test` and `npm run build` in GitHub Actions.
- Inspect Android manifest/service declarations and timer lifecycle.
- Verify data import/export and active timer restoration on a physical Android device.
- Review all remaining modules before declaring Phase 0 complete.

## Upgrade sequence
Phases 1–12 remain planned and must be implemented incrementally. A phase is complete only after code changes and relevant automated checks pass.
