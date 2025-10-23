// apps/api/src/sse/order-status.js
import { Router } from "express";
import { ObjectId } from "mongodb";

const router = Router();

/** Small helper to write one SSE frame */
function sseWrite(res, event, payload, id) {
  if (id) res.write(`id: ${id}\n`);
  if (event) res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

/** Normalize DB status → UI-friendly step label */
function normalizeStatus(v) {
  const s = String(v || "").toUpperCase();
  if (s.startsWith("PEND")) return "Placed";
  if (s.startsWith("PROC")) return "Packed";
  if (s.startsWith("SHIP")) return "Shipped";
  if (s.startsWith("DELIV") || s.startsWith("COMPL")) return "Delivered";
  return "Placed";
}

/**
 * GET /api/orders/:id/stream
 * Streams order updates as SSE:
 *   { type:"status", status:"Placed|Packed|Shipped|Delivered" }
 *   { type:"eta",    eta:"3–5 days" }   (optional, if present in DB)
 */
router.get("/orders/:id/stream", async (req, res, next) => {
  const rawId = String(req.params.id || "").trim();

  // SSE headers
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  // Heartbeat so proxies keep the connection open
  const HEARTBEAT_MS = 15_000;
  const hb = setInterval(() => {
    try {
      res.write(": ping\n\n");
    } catch {
      clearInterval(hb);
    }
  }, HEARTBEAT_MS);

  // Cleanup
  let closed = false;
  let changeStream = null;
  let pollTimer = null;
  const close = () => {
    if (closed) return;
    closed = true;
    clearInterval(hb);
    try { res.end(); } catch {}
    if (changeStream) {
      try {
        changeStream.removeAllListeners();
        changeStream.close().catch(() => {});
      } catch {}
      changeStream = null;
    }
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  };
  req.on("close", close);
  req.on("aborted", close);

  try {
    const orders = req.db.collection("orders");

    // Accept either ObjectId (_id) or a custom string orderId field
    const query = ObjectId.isValid(rawId)
      ? { _id: new ObjectId(rawId) }
      : { orderId: rawId };

    let order = await orders.findOne(query);
    if (!order) {
      sseWrite(res, "error", { type: "error", error: "Not Found" });
      return close();
    }

    // Initial snapshot
    const initial = normalizeStatus(order.status || "PENDING");
    sseWrite(res, "message", { type: "status", status: initial });
    if (order.eta) sseWrite(res, "message", { type: "eta", eta: order.eta });

    // Prefer Mongo change streams; fall back to polling if unsupported
    try {
      const pipeline = [{ $match: { "fullDocument._id": order._id } }];
      changeStream = orders.watch(pipeline, { fullDocument: "updateLookup" });

      changeStream.on("change", (ev) => {
        const doc = ev.fullDocument || {};
        const st = normalizeStatus(doc.status);
        sseWrite(res, "message", { type: "status", status: st });
        if (doc.eta) sseWrite(res, "message", { type: "eta", eta: doc.eta });
      });

      changeStream.on("error", () => {
        try { changeStream.close().catch(() => {}); } catch {}
        changeStream = null;
        startPolling();
      });

      changeStream.on("end", close);
    } catch {
      // .watch() threw synchronously
      startPolling();
    }

    function startPolling() {
      const INTERVAL = 3000;
      let lastStatus = initial;
      let lastEta = order?.eta ?? null;

      pollTimer = setInterval(async () => {
        if (closed) return;
        try {
          const latest = await orders.findOne(
            { _id: order._id },
            { projection: { status: 1, eta: 1, updatedAt: 1 } }
          );
          if (!latest) return;

          const st = normalizeStatus(latest.status);
          if (st !== lastStatus) {
            lastStatus = st;
            sseWrite(res, "message", { type: "status", status: st });
          }
          if (latest.eta && latest.eta !== lastEta) {
            lastEta = latest.eta;
            sseWrite(res, "message", { type: "eta", eta: latest.eta });
          }
        } catch {
          // ignore transient polling errors
        }
      }, INTERVAL);
    }
  } catch (err) {
    try { sseWrite(res, "error", { type: "error", error: "Internal Error" }); } catch {}
    next(err);
  }
});

export default router;
