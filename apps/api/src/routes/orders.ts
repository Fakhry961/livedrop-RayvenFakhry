import { Router, type Request, type Response } from 'express';
import type { Db } from 'mongodb';
import { ObjectId } from 'mongodb';

export default function createOrdersRouter(db: Db) {
  const router = Router();

  /** POST /api/orders  { customerId, items:[{productId, qty}], notes? } */
  router.post('/', async (req: Request, res: Response) => {
    const { customerId, items, notes } = req.body ?? {};

    if (!customerId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'customerId and non-empty items are required' });
    }

    const order = {
      customerId: new ObjectId(customerId),
      items: items.map((it: any) => ({
        productId: new ObjectId(it.productId),
        qty: Number(it.qty) || 1,
      })),
      status: 'PENDING',
      notes: notes ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('orders').insertOne(order);
    res.status(201).json({ _id: result.insertedId, ...order });
  });

  /** GET /api/orders/:id */
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const order = await db.collection('orders').findOne({ _id: new ObjectId(req.params.id) });
      if (!order) return res.status(404).json({ error: 'Order not found' });
      res.json(order);
    } catch {
      res.status(400).json({ error: 'Invalid order id' });
    }
  });

  /** GET /api/orders?customerId=... */
  router.get('/', async (req: Request, res: Response) => {
    const { customerId } = req.query as { customerId?: string };
    const q = customerId ? { customerId: new ObjectId(customerId) } : {};
    const orders = await db.collection('orders').find(q).sort({ createdAt: -1 }).limit(50).toArray();
    res.json(orders);
  });

  return router;
}
