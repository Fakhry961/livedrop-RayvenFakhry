// products.js
import { Router } from 'express';
import { ObjectId } from 'mongodb';

const router = Router();

router.get('/products', async (req, res, next) => {
  try {
    const { search = '', tag = '', category = '', sort = 'createdAt', order = 'desc', page = 1, limit = 20 } = req.query;

    const q = {};
    if (search) q.$text = { $search: String(search) };
    if (tag) q.tags = String(tag);
    if (category) q.category = String(category);

    const sortMap = { price: 'price', name: 'name', createdAt: 'createdAt' };
    const sortField = sortMap[sort] || 'createdAt';
    const sortDir = order === 'asc' ? 1 : -1;

    const lim = Math.min(Math.max(Number(limit), 1), 100);
    const skip = (Math.max(Number(page), 1) - 1) * lim;

    const coll = req.db.collection('products');
    const [items, total] = await Promise.all([
      coll.find(q).sort({ [sortField]: sortDir }).skip(skip).limit(lim).toArray(),
      coll.countDocuments(q)
    ]);

    res.json({ items, page: Number(page), limit: lim, total, totalPages: Math.ceil(total / lim) });
  } catch (e) { next(e); }
});

router.get('/products/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).json({ error: { code: 400, message: 'Invalid product id' }});
    const doc = await req.db.collection('products').findOne({ _id: new ObjectId(id) });
    if (!doc) return res.status(404).json({ error: { code: 404, message: 'Product not found' }});
    res.json(doc);
  } catch (e) { next(e); }
});

router.post('/products', async (req, res, next) => {
  try {
    const { name, price, stock = 0, category = 'general', tags = [] } = req.body || {};
    if (!name || typeof price !== 'number') {
      return res.status(400).json({ error: { code: 400, message: 'Missing required fields: name, price' }});
    }
    const doc = { name, price, stock, category, tags, createdAt: new Date(), updatedAt: new Date(), active: true };
    const { insertedId } = await req.db.collection('products').insertOne(doc);
    const created = await req.db.collection('products').findOne({ _id: insertedId });
    res.status(201).json(created);
  } catch (e) { next(e); }
});

export default router;
