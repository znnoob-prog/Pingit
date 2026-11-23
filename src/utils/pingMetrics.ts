// src/utils/pingMetrics.ts

export interface PingRating {
  status: 'Ultra Fast' | 'Fast' | 'Normal' | 'High Latency';
  color: string;
  badge: string;
  ratingScore: number;
}

export function calculatePingRating(latencyMs: number): PingRating {
  if (latencyMs <= 40) {
    return {
      status: 'Ultra Fast',
      color: 'emerald',
      badge: '⚡ <40ms',
      ratingScore: 99,
    };
  }
  if (latencyMs <= 90) {
    return {
      status: 'Fast',
      color: 'cyan',
      badge: '🚀 <90ms',
      ratingScore: 85,
    };
  }
  if (latencyMs <= 180) {
    return {
      status: 'Normal',
      color: 'amber',
      badge: '⏱️ Normal',
      ratingScore: 70,
    };
  }
  return {
    status: 'High Latency',
    color: 'rose',
    badge: '🐢 High',
    ratingScore: 40,
  };
}

export function formatPingLatency(latencyMs: number | undefined | null): string {
  if (latencyMs === undefined || latencyMs === null || isNaN(latencyMs)) {
    return '-- ms';
  }
  return `${Math.round(latencyMs)} ms`;
}

export function getPingAudioPitch(pingType: string): number {
  switch (pingType) {
    case 'urgent':
      return 880; // A5
    case 'wave':
      return 659.25; // E5
    case 'heartbeat':
      return 440; // A4
    default:
      return 523.25; // C5
  }
}

export function getPingSummary(latencies: number[]): {
  count: number;
  avg: number;
  min: number;
  max: number;
  jitter: number;
} {
  if (!latencies || latencies.length === 0) {
    return { count: 0, avg: 0, min: 0, max: 0, jitter: 0 };
  }

  const valid = latencies.filter((l) => typeof l === 'number' && !isNaN(l) && l >= 0);
  if (valid.length === 0) {
    return { count: 0, avg: 0, min: 0, max: 0, jitter: 0 };
  }

  const min = Math.min(...valid);
  const max = Math.max(...valid);
  const sum = valid.reduce((acc, curr) => acc + curr, 0);
  const avg = Math.round(sum / valid.length);

  // Approximate jitter (average absolute difference between consecutive pings)
  let jitterSum = 0;
  for (let i = 1; i < valid.length; i++) {
    jitterSum += Math.abs(valid[i] - valid[i - 1]);
  }
  const jitter = valid.length > 1 ? Math.round(jitterSum / (valid.length - 1)) : 0;

  return {
    count: valid.length,
    avg,
    min,
    max,
    jitter,
  };
}
