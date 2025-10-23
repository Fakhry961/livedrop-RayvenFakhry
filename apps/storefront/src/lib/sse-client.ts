// Lightweight EventSource wrapper with auto-reconnect + heartbeat.
// Usage:
//   import { SSEClient } from "../lib/sse-client";
//   const sse = new SSEClient(`${API}/api/orders/${id}/stream`, { onMessage: ... });
//   sse.start();  // later: sse.close();

export type SSEMessage = { event?: string; id?: string; data?: any };
export type SSEOptions = {
  withCredentials?: boolean;
  onOpen?: () => void;
  onMessage?: (msg: SSEMessage) => void;
  onError?: (err: Event | Error) => void;
  minDelayMs?: number;   // reconnect backoff start
  maxDelayMs?: number;   // reconnect backoff cap
  heartbeatMs?: number;  // if no message within this window → reconnect
};

export class SSEClient {
  private url: string;
  private es: EventSource | null = null;
  private stopped = false;
  private opts: Required<SSEOptions>;
  private backoff = 0;
  private lastMsgAt = 0;
  private heartTimer: number | null = null;

  constructor(url: string, opts: SSEOptions = {}) {
    this.url = url;
    this.opts = {
      withCredentials: !!opts.withCredentials,
      onOpen: opts.onOpen ?? (() => {}),
      onMessage: opts.onMessage ?? (() => {}),
      onError: opts.onError ?? (() => {}),
      minDelayMs: opts.minDelayMs ?? 1000,
      maxDelayMs: opts.maxDelayMs ?? 15000,
      heartbeatMs: opts.heartbeatMs ?? 30000,
    };
  }

  start() {
    this.stopped = false;
    this.open();
  }

  private open() {
    if (this.stopped) return;

    // Note: native EventSource doesn't support custom headers.
    this.es = new EventSource(this.url, {
      withCredentials: this.opts.withCredentials,
    });

    this.es.onopen = () => {
      this.backoff = 0;
      this.lastMsgAt = Date.now();
      this.opts.onOpen();
      this.armHeartbeat();
    };

    this.es.onmessage = (e) => {
      this.lastMsgAt = Date.now();
      let data: any = e.data;
      try { data = JSON.parse(e.data); } catch {}
      this.opts.onMessage({ event: e.type, id: (e as any).lastEventId, data });
    };

    this.es.onerror = (err) => {
      this.opts.onError(err);
      this.reconnect();
    };
  }

  private armHeartbeat() {
    if (this.heartTimer) window.clearInterval(this.heartTimer);
    const hb = this.opts.heartbeatMs;
    this.heartTimer = window.setInterval(() => {
      if (Date.now() - this.lastMsgAt > hb) this.reconnect();
    }, hb);
  }

  private reconnect() {
    if (this.stopped) return;
    this.close(false);
    this.backoff = Math.min(
      this.backoff ? this.backoff * 2 : this.opts.minDelayMs,
      this.opts.maxDelayMs
    );
    window.setTimeout(() => this.open(), this.backoff);
  }

  close(markStopped = true) {
    if (markStopped) this.stopped = true;
    if (this.heartTimer) { window.clearInterval(this.heartTimer); this.heartTimer = null; }
    try { this.es?.close(); } catch {}
    this.es = null;
  }
}
