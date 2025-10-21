// apps/api/src/routes/orders.js
import { Router } from 'express';
import { ObjectId } from 'mongodb';

const router = Router();

const ALLOWED_STATUSES = [
  'PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'COMPLETED'
];

function bad(res, code, message) {
  return res.status(code).json({ error: { code, message } });
}

// POST /api/orders  -> create order
router.post('/orders', async (req, res, next) => {
  try {
    const { customerId, items = [] } = req.body || {};
    const cleanCustomerId = String(customerId || '').trim();

    if (!cleanCustomerId || !Array.isArray(items) || items.length === 0) {
      return bad(res, 400, 'Missing customerId or items[]');
    }
    if (!ObjectId.isValid(cleanCustomerId)) {
      return bad(res, 400, 'Invalid customerId');
    }

    // Convert and validate product IDs
    const wantedIds = [];
    for (const it of items) {
      const pid = String(it?.productId || '').trim();
      if (!ObjectId.isValid(pid)) return bad(res, 400, `Invalid productId: ${pid}`);
      wantedIds.push(new ObjectId(pid));
    }

    // Fetch all referenced products at once
    const prods = await req.db.collection('products').find({ _id: { $in: wantedIds } }).toArray();
    const byId = new Map(prods.map(p => [String(p._id), p]));

    // Build normalized cart; fail if any product is unknown
    const normalized = [];
    for (const it of items) {
      const pid = String(it.productId).trim();
      const p = byId.get(pid);
      if (!p) return bad(res, 400, `Unknown productId: ${pid}`);
      const qty = Math.max(1, Number(it.qty || 1));
      normalized.push({ productId: p._id, name: p.name, price: p.price, qty });
    }

    const subtotal = normalized.reduce((s, it) => s + it.price * it.qty, 0);
    const shipping = subtotal > 8000 ? 0 : 799;
    const tax = Math.round(subtotal * 0.07);
    const total = subtotal + shipping + tax;

    const now = new Date();
    const order = {
      customerId: new ObjectId(cleanCustomerId),
      items: normalized,
      status: 'PENDING',
      amounts: { subtotal, shipping, tax, total, currency: 'USD' },
      createdAt: now,
      updatedAt: now,
      history: [{ status: 'PENDING', at: now }],
    };

    const { insertedId } = await req.db.collection('orders').insertOne(order);
    const created = await req.db.collection('orders').findOne({ _id: insertedId });
    return res.status(201).json(created);
  } catch (e) { next(e); }
});

// GET /api/orders/:id  -> read single
router.get('/orders/:id', async (req, res, next) => {
  try {
    const id = String(req.params.id || '').trim();
    if (!ObjectId.isValid(id)) return bad(res, 400, 'Invalid order id');
    const doc = await req.db.collection('orders').findOne({ _id: new ObjectId(id) });
    if (!doc) return bad(res, 404, 'Order not found');
    return res.json(doc);
  } catch (e) { next(e); }
});

// GET /api/orders?customerId=&page=&limit=  -> list
router.get('/orders', async (req, res, next) => {
  try {
    const { customerId, page = 1, limit = 20 } = req.query;
    const q = {};
    if (customerId) {
      const cid = String(customerId).trim();
      if (!ObjectId.isValid(cid)) return bad(res, 400, 'Invalid customerId');
      q.customerId = new ObjectId(cid);
    }
    const lim = Math.min(Math.max(Number(limit), 1), 100);
    const skip = (Math.max(Number(page), 1) - 1) * lim;

    const coll = req.db.collection('orders');
    const [items, total] = await Promise.all([
      coll.find(q).sort({ createdAt: -1 }).skip(skip).limit(lim).toArray(),
      coll.countDocuments(q),
    ]);

    return res.json({
      items,
      page: Number(page),
      limit: lim,
      total,
      totalPages: Math.ceil(total / lim),
    });
  } catch (e) { next(e); }
});

// PUT /api/orders/:id/status  -> update status (logs history only when it changes)
router.put('/orders/:id/status', async (req, res, next) => {
  try {
    const id = String(req.params.id || '').trim();
    const statusRaw = String((req.body || {}).status || '').trim().toUpperCase();

    if (!ObjectId.isValid(id)) return bad(res, 400, 'Invalid order id');
    if (!statusRaw || !ALLOWED_STATUSES.includes(statusRaw)) {
      return bad(res, 400, `Invalid or missing status. Allowed: ${ALLOWED_STATUSES.join(', ')}`);
    }

    const orders = req.db.collection('orders');
    const existing = await orders.findOne({ _id: new ObjectId(id) });
    if (!existing) return bad(res, 404, 'Order not found');

    const now = new Date();

    // Only push to history if the status actually changes
    const updates = {
      $set: { status: statusRaw, updatedAt: now },
    };
    if (existing.status !== statusRaw) {
      updates.$push = { history: { status: statusRaw, at: now } };
    }

    const { value } = await orders.findOneAndUpdate(
      { _id: existing._id },
      updates,
      { returnDocument: 'after' }
    );

    return res.json(value);
  } catch (e) { next(e); }
});

export default router;
