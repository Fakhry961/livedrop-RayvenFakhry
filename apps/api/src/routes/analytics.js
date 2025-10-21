// apps/api/src/routes/analytics.js
import { Router } from 'express';

const router = Router();

// GET /api/analytics/daily-revenue?from&to
// ($match by date → $group by day → $sort by date)
router.get('/analytics/daily-revenue', async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const fromDate = from ? new Date(from) : new Date(Date.now() - 1000 * 60 * 60 * 24 * 21);
    const toDate   = to   ? new Date(to)   : new Date();

    const days = await req.db.collection('orders').aggregate([
      { $match: { createdAt: { $gte: fromDate, $lte: toDate } } },
      { $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$amounts.total' },
          orders:  { $sum: 1 }
        } },
      { $sort: { _id: 1 } }
    ]).toArray();

    res.json({ from: fromDate, to: toDate, days });
  } catch (e) { next(e); }
});

export default router;
