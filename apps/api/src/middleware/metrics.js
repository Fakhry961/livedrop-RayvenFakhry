// src/middleware/metrics.js (ESM)
import { performance } from 'node:perf_hooks';


const metrics = {
  startedAt: new Date(),
  requests: 0,
  totalLatencyMs: 0,
  maxLatencyMs: 0,
  lastMinute: [],
  sseConnections: 0,
  llmCalls: 0,
  llmFailures: 0,
};

export function metricsMiddleware(req, res, next) {
  const t0 = performance.now();
  metrics.requests++;

  res.on('finish', () => {
    const dt = performance.now() - t0;
    metrics.totalLatencyMs += dt;
    metrics.maxLatencyMs = Math.max(metrics.maxLatencyMs, dt);
    const now = Date.now();
    metrics.lastMinute.push({ t: now, dt });
    metrics.lastMinute = metrics.lastMinute.filter(p => now - p.t <= 60_000);
  });

  next();
}

export function recordSSE(openDelta) {
  metrics.sseConnections = Math.max(0, metrics.sseConnections + openDelta);
}

export function recordLLM(ok) {
  if (ok) metrics.llmCalls++;
  else metrics.llmFailures++;
}

export function snapshot() {
  const lastMin = metrics.lastMinute;
  const avgAll = metrics.requests ? metrics.totalLatencyMs / metrics.requests : 0;
  const avg1m = lastMin.length ? lastMin.reduce((s, p) => s + p.dt, 0) / lastMin.length : 0;
  const p95 = lastMin.length
    ? lastMin.map(p => p.dt).sort((a,b)=>a-b)[Math.floor(lastMin.length * 0.95) - 1] || 0
    : 0;

  return {
    startedAt: metrics.startedAt,
    requests: metrics.requests,
    avgLatencyMs: Math.round(avgAll),
    avgLatency1mMs: Math.round(avg1m),
    p95Latency1mMs: Math.round(p95),
    maxLatencyMs: Math.round(metrics.maxLatencyMs),
    sseConnections: metrics.sseConnections,
    llm: { calls: metrics.llmCalls, failures: metrics.llmFailures },
  };
}
