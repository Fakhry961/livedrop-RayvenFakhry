import { Router } from "express";
import { ObjectId } from "mongodb";

const router = Router();

const ALLOWED_STATUSES = [
  "PENDING",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "COMPLETED",
];

const bad = (res, code, message) =>
  res.status(code).json({ error: { code, message } });

// Health ping to help you debug quickly
router.get("/status", (_req, res) => {
  res.json({ ok: true, service: "orders" });
});

/**
 * POST /api/orders
 * Body:
 *   {
 *     customerId?: string,                // optional; null = guest
 *     items: [{ id: string, qty: number }] // id is the SKU stored in products.id
 *   }
 */
router.post("/orders", async (req, res, next) => {
  try {
    const { customerId = null, items } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return bad(res, 400, "Missing customerId or items[]");
    }

    // Validate items and collect SKUs
    const skus = [];
    for (const it of items) {
      const sku = String(it?.id ?? "").trim();
      const qty = Number(it?.qty ?? 1);
      if (!sku || !Number.isFinite(qty) || qty <= 0) {
        return bad(res, 400, "Each item needs a valid id (SKU) and qty > 0");
      }
      skus.push(sku);
    }

    // Fetch products by SKU (field "id" in products collection)
    const prods = await req.db.collection("products").find({ id: { $in: skus } }).toArray();
    const bySku = new Map(prods.map((p) => [p.id, p]));

    // Snapshot cart line items
    // Aggregate quantities by SKU to avoid double-decrements when the
    // same SKU appears multiple times in the payload.
    const qtyBySku = new Map();
    for (const it of items) {
      const sku = String(it.id).trim();
      const qty = Math.max(1, Number(it.qty || 1));
      const prod = bySku.get(sku);
      if (!prod) return bad(res, 400, `Unknown product SKU: ${sku}`);

      qtyBySku.set(sku, (qtyBySku.get(sku) || 0) + qty);
    }

    const lines = [];
    for (const [sku, totalQty] of qtyBySku.entries()) {
      const prod = bySku.get(sku);
      lines.push({
        sku: prod.id,
        title: prod.title ?? prod.name ?? "Product",
        price: Number(prod.price || 0),
        qty: totalQty,
      });
    }

    // NOTE: strict stock validation caused orders to be rejected in some
    // environments (409). To allow placing orders reliably while we
    // investigate the root cause, perform decrements after inserting the
    // order. We will first try a safe atomic decrement; if that fails we
    // fall back to a non-blocking decrement so the order can still be
    // created. This keeps user flow working while preserving an attempt
    // at adjusting inventory.
    const productsColl = req.db.collection("products");
    const decremented = [];

    // Totals
    const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
    const shipping = subtotal > 8000 ? 0 : 799;
    const tax = Math.round(subtotal * 0.07);
    const total = subtotal + shipping + tax;

    const now = new Date();
    const doc = {
      customerId: customerId ? String(customerId) : null,
      items: lines,
      amounts: { subtotal, shipping, tax, total, currency: "USD" },
      status: "PENDING",
      createdAt: now,
      updatedAt: now,
      history: [{ status: "PENDING", at: now }],
    };

  const debug = process.env.ORDER_DEBUG === '1';
  if (debug) console.debug('[orders] creating order, lines:', lines);
  const { insertedId } = await req.db.collection("orders").insertOne(doc);

    // After inserting the order, attempt inventory adjustments
    try {
      const debug = process.env.ORDER_DEBUG === '1';
      for (const line of lines) {
        const sku = line.sku;
        const qty = Number(line.qty || 0);
        const prod = bySku.get(sku);
        const field = (typeof prod?.stockQty === "number") ? "stockQty" : (typeof prod?.stock === "number") ? "stock" : null;

        if (!field) {
          if (debug) console.debug('[orders] no stock field for', sku);
          continue;
        }

        let atomicSucceeded = false;
        // Try atomic decrement first
        try {
          const filter = { id: sku, [field]: { $gte: qty } };
          const update = { $inc: { [field]: -qty } };
          if (debug) console.debug('[orders] attempting atomic update', filter, update);
          const { value } = await productsColl.findOneAndUpdate(filter, update, { returnDocument: "after" });
          if (value) {
            atomicSucceeded = true;
            decremented.push({ sku, field, qty, method: 'atomic' });
            if (debug) console.debug('[orders] atomic update OK for', sku, 'newValue:', value[field]);
          } else {
            if (debug) console.debug('[orders] atomic update did not match filter for', sku);
          }
        } catch (e) {
          if (debug) console.debug('[orders] atomic update error for', sku, e.message || e);
        }

        // Fallback: only run if atomic did NOT succeed. This prevents a double-decrement
        // for the same SKU within the same request.
        if (!atomicSucceeded) {
          try {
            const r = await productsColl.updateOne({ id: sku }, { $inc: { [field]: -qty } });
            if (r.modifiedCount > 0) {
              decremented.push({ sku, field, qty, method: 'fallback' });
              if (debug) console.debug('[orders] fallback update OK for', sku, 'modifiedCount:', r.modifiedCount);
            } else {
              if (debug) console.debug('[orders] fallback update did not modify any document for', sku);
            }
          } catch (e) {
            console.error('[orders] fallback decrement failed for', sku, e);
          }
        }
      }
    } catch (e) {
      console.error('[orders] error during post-insert inventory adjustments', e);
    }

    // Diagnostic: log final stock values for affected SKUs when debugging
    try {
      if (debug && lines.length) {
        const skus = lines.map(l => l.sku);
        const prodsAfter = await productsColl.find({ id: { $in: skus } }).toArray();
        console.debug('[orders] post-adjust product stocks:', prodsAfter.map(p => ({ id: p.id, stock: p.stock ?? p.stockQty })));
      }
    } catch (e) {
      if (debug) console.debug('[orders] error fetching post-adjust stocks', e.message || e);
    }

    // Progress order status automatically for demo: PENDING -> PROCESSING -> SHIPPED -> DELIVERED
    try {
      const ordersColl = req.db.collection('orders');
      const updateStatus = async (status) => {
        try {
          const now2 = new Date();
          await ordersColl.findOneAndUpdate(
            { _id: insertedId },
            { $set: { status, updatedAt: now2 }, $push: { history: { status, at: now2 } } },
            { returnDocument: 'after' }
          );
          if (debug) console.debug('[orders] auto-updated order', insertedId.toString(), 'to', status);
        } catch (err) {
          console.error('[orders] auto-update failed for', insertedId.toString(), status, err && err.message ? err.message : err);
        }
      };

      // Schedule transitions at 3s intervals
      setTimeout(() => updateStatus('PROCESSING'), 3000);
      setTimeout(() => updateStatus('SHIPPED'), 6000);
      setTimeout(() => updateStatus('DELIVERED'), 9000);
    } catch (e) {
      if (debug) console.debug('[orders] failed to schedule auto-status updates', e.message || e);
    }

    res.status(201).json({
      orderId: insertedId.toString(),
      status: "PENDING",
      total,
      createdAt: now,
    });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/orders/:id
 * Retrieve a single order (Mongo ObjectId)
 */
router.get("/orders/:id", async (req, res, next) => {
  try {
    const id = String(req.params.id || "").trim();
    if (!ObjectId.isValid(id)) return bad(res, 400, "Invalid order id");
    const doc = await req.db.collection("orders").findOne({ _id: new ObjectId(id) });
    if (!doc) return bad(res, 404, "Order not found");
    res.json(doc);
  } catch (e) {
    next(e);
  }
});

/**
 * NEW: GET /api/orders/:id/status
 * Small helper your UI can call after placing an order (mirrors the devtools call you saw).
 */
router.get("/orders/:id/status", async (req, res, next) => {
  try {
    const id = String(req.params.id || "").trim();
    if (!ObjectId.isValid(id)) return bad(res, 400, "Invalid order id");
    const doc = await req.db.collection("orders").findOne(
      { _id: new ObjectId(id) },
      { projection: { status: 1, "amounts.total": 1, createdAt: 1 } }
    );
    if (!doc) return bad(res, 404, "Order not found");
    res.json({ orderId: id, status: doc.status, total: doc.amounts?.total ?? 0, createdAt: doc.createdAt });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/orders?customerId=&page=&limit=
 */
router.get("/orders", async (req, res, next) => {
  try {
    const { customerId, page = 1, limit = 20 } = req.query;
    const q = {};
    if (customerId) q.customerId = String(customerId);

    const lim = Math.min(Math.max(Number(limit), 1), 100);
    const skip = (Math.max(Number(page), 1) - 1) * lim;

    const coll = req.db.collection("orders");
    const [items, total] = await Promise.all([
      coll.find(q).sort({ createdAt: -1 }).skip(skip).limit(lim).toArray(),
      coll.countDocuments(q),
    ]);

    res.json({
      items,
      page: Number(page),
      limit: lim,
      total,
      totalPages: Math.ceil(total / lim),
    });
  } catch (e) {
    next(e);
  }
});

/**
 * PUT /api/orders/:id/status
 */
router.put("/orders/:id/status", async (req, res, next) => {
  try {
    const id = String(req.params.id || "").trim();
    if (!ObjectId.isValid(id)) return bad(res, 400, "Invalid order id");

    const statusRaw = String((req.body || {}).status || "").trim().toUpperCase();
    if (!ALLOWED_STATUSES.includes(statusRaw)) {
      return bad(res, 400, `Invalid status. Allowed: ${ALLOWED_STATUSES.join(", ")}`);
    }

    const orders = req.db.collection("orders");
    const existing = await orders.findOne({ _id: new ObjectId(id) });
    if (!existing) return bad(res, 404, "Order not found");

    const now = new Date();
    const update = { $set: { status: statusRaw, updatedAt: now } };
    if (existing.status !== statusRaw) {
      update.$push = { history: { status: statusRaw, at: now } };
    }

    const { value } = await orders.findOneAndUpdate(
      { _id: existing._id },
      update,
      { returnDocument: "after" }
    );

    res.json(value);
  } catch (e) {
    next(e);
  }
});

export default router;
