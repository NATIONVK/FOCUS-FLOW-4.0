import test from 'node:test';
import assert from 'node:assert/strict';
import { dailyReflectionTitle, getDailyReflection } from '../src/daily-reflection.js';

test('daily reflection title uses the local calendar date', () => {
  assert.equal(dailyReflectionTitle(new Date(2026, 10, 18)), 'Daily Reflection · 2026-11-18');
});

test('daily reflection lookup returns only the matching day entry', () => {
  const notes = [
    { id: 'old', title: 'Daily Reflection · 2026-11-17', body: 'Yesterday' },
    { id: 'today', title: 'Daily Reflection · 2026-11-18', body: 'Today' }
  ];
  assert.equal(getDailyReflection(notes, new Date(2026, 10, 18)).id, 'today');
  assert.equal(getDailyReflection(notes, new Date(2026, 10, 19)), null);
});

test('daily reflection lookup tolerates missing note collections', () => {
  assert.equal(getDailyReflection(undefined, new Date(2026, 10, 18)), null);
});
