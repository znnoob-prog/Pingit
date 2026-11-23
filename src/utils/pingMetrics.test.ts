// src/utils/pingMetrics.test.ts
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculatePingRating,
  formatPingLatency,
  getPingAudioPitch,
  getPingSummary,
} from './pingMetrics.ts';
import { encodeGmailRfc2822 } from './gmailEncoder.ts';
import { filterActivities, formatTimeAgo } from './activityFilters.ts';

test('calculatePingRating categorizes latencies correctly', () => {
  const ultra = calculatePingRating(25);
  assert.equal(ultra.status, 'Ultra Fast');
  assert.equal(ultra.color, 'emerald');

  const fast = calculatePingRating(75);
  assert.equal(fast.status, 'Fast');

  const normal = calculatePingRating(140);
  assert.equal(normal.status, 'Normal');

  const high = calculatePingRating(250);
  assert.equal(high.status, 'High Latency');
});

test('formatPingLatency formats numbers and edge cases', () => {
  assert.equal(formatPingLatency(32.4), '32 ms');
  assert.equal(formatPingLatency(0), '0 ms');
  assert.equal(formatPingLatency(null), '-- ms');
  assert.equal(formatPingLatency(undefined), '-- ms');
});

test('getPingAudioPitch returns distinct tones for ping types', () => {
  assert.equal(getPingAudioPitch('urgent'), 880);
  assert.equal(getPingAudioPitch('normal'), 523.25);
  assert.equal(getPingAudioPitch('wave'), 659.25);
});

test('getPingSummary aggregates latency arrays accurately', () => {
  const summary = getPingSummary([20, 30, 40]);
  assert.equal(summary.count, 3);
  assert.equal(summary.avg, 30);
  assert.equal(summary.min, 20);
  assert.equal(summary.max, 40);
  assert.equal(summary.jitter, 10);
});

test('encodeGmailRfc2822 produces valid base64url string', () => {
  const encoded = encodeGmailRfc2822(
    'friend@example.com',
    'me@example.com',
    'Pingit Chat Ping',
    'Hello from Pingit!'
  );
  assert.ok(typeof encoded === 'string');
  assert.ok(encoded.length > 20);
  // Base64URL must not contain '+', '/', or '='
  assert.equal(encoded.includes('+'), false);
  assert.equal(encoded.includes('/'), false);
  assert.equal(encoded.includes('='), false);
});

test('filterActivities filters by tag and query', () => {
  const sample = [
    { id: 1, content: 'Morning coffee ping', tag: 'ping', authorName: 'Alex' },
    { id: 2, content: 'Tech meetup checkin', tag: 'checkin', authorName: 'Maya' },
    { id: 3, content: 'Modular synth shout', tag: 'shout', authorName: 'Liam' },
  ];

  const pingsOnly = filterActivities(sample, 'ping', '');
  assert.equal(pingsOnly.length, 1);
  assert.equal(pingsOnly[0].id, 1);

  const searchMaya = filterActivities(sample, 'all', 'Maya');
  assert.equal(searchMaya.length, 1);
  assert.equal(searchMaya[0].authorName, 'Maya');
});

test('formatTimeAgo calculates relative time correctly', () => {
  const now = 1700000000000;
  assert.equal(formatTimeAgo(now - 5000, now), 'just now');
  assert.equal(formatTimeAgo(now - 45000, now), '45s ago');
  assert.equal(formatTimeAgo(now - 300000, now), '5m ago');
  assert.equal(formatTimeAgo(now - 7200000, now), '2h ago');
});
