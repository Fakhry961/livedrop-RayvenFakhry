// customers.js
import { Router } from 'express';
import { ObjectId } from 'mongodb';

const router = Router();

router.get('/customers', async (req, res, next) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: { code: 400, message: 'Missing email param' }});
    const doc = await req.db.collection('customers').findOne({ email: String(email).toLowerCase() });
    if (!doc) return res.status(404).json({ error: { code: 404, message: 'Customer not found' }});
    res.json(doc);
  } catch (e) { next(e); }
});

router.get('/customers/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).json({ error: { code: 400, message: 'Invalid customer id' }});
    const doc = await req.db.collection('customers').findOne({ _id: new ObjectId(id) });
    if (!doc) return res.status(404).json({ error: { code: 404, message: 'Customer not found' }});
    res.json(doc);
  } catch (e) { next(e); }
});

export default router;
