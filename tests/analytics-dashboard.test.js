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

test('sessionStartSummary returns an empty-data-safe best bucket', () => {
  const summary = Analytics.sessionStartSummary([]);
  assert.equal(summary.best.count, 0);
  assert.equal(summary.best.seconds, 0);
});
