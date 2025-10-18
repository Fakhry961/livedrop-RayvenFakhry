import { Router } from 'express';
import { getDb } from '../db.js';
import { ObjectId } from 'mongodb';

const router = Router();

router.get('/', async (req, res) => {
  const db = getDb();
  const { email } = req.query as { email?: string };
  const q = email ? { email } : {};
  const customers = await db.collection('customers').find(q).limit(20).toArray();
  res.json(customers);
});

router.get('/:id', async (req, res) => {
  try {
    const db = getDb();
    const doc = await db.collection('customers').findOne({ _id: new ObjectId(req.params.id) });
    if (!doc) return res.status(404).json({ error: 'Customer not found' });
    res.json(doc);
  } catch {
    res.status(400).json({ error: 'Invalid customer id' });
  }
});

export default router;
