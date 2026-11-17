import test from 'node:test';
import assert from 'node:assert/strict';
import { Analytics } from '../src/analytics.js';

test('sessionStartSummary counts session starts, not duration as session frequency', () => {
  const sessions = [
    { startedAt: new Date(2026, 10, 15, 8, 10).toISOString(), duration: 1800 },
    { startedAt: new Date(2026, 10, 15, 9, 10).toISOString(), duration: 60 },
    { startedAt: new Date(2026, 10, 15, 18, 10).toISOString(), duration: 7200 }
  ];
  const summary = Analytics.sessionStartSummary(sessions);
  assert.equal(summary.best.label, 'Morning');
  assert.equal(summary.best.count, 2);
  assert.equal(summary.best.seconds, 1860);
});

test('sessionStartSummary ignores invalid timestamps and clamps invalid durations', () => {
  const sessions = [
    { startedAt: 'not-a-date', duration: 999 },
    { startedAt: new Date(2026, 10, 15, 23, 10).toISOString(), duration: -10 },
    { startedAt: new Date(2026, 10, 15, 2, 10).toISOString(), duration: 'bad' }
  ];
  const summary = Analytics.sessionStartSummary(sessions);
  assert.equal(summary.best.label, 'Night');
  assert.equal(summary.best.count, 2);
  assert.equal(summary.best.seconds, 0);
});

test('filterRange includes the selected local calendar window and ignores invalid timestamps', () => {
  const now = new Date(2026, 10, 17, 12, 0, 0);
  const sessions = [
    { id: 'today', startedAt: new Date(2026, 10, 17, 8).toISOString(), duration: 60 },
    { id: 'boundary', startedAt: new Date(2026, 9, 19, 0, 1).toISOString(), duration: 60 },
    { id: 'outside', startedAt: new Date(2026, 9, 17, 12).toISOString(), duration: 60 },
    { id: 'invalid', startedAt: 'not-a-date', duration: 60 }
  ];
  assert.deepEqual(Analytics.filterRange(sessions, 30, now).map(x => x.id), ['today', 'boundary']);
  assert.equal(Analytics.filterRange(sessions, 0, now).length, 4);
});

test('sessionStartSummary returns an empty-data-safe best bucket', () => {
  const summary = Analytics.sessionStartSummary([]);
  assert.equal(summary.best.count, 0);
  assert.equal(summary.best.seconds, 0);
});
