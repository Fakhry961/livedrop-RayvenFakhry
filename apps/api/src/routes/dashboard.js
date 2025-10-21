// apps/api/src/routes/dashboard.js
import { Router } from 'express';

const router = Router();

/**
 * GET /api/dashboard/business-metrics
 * - totalRevenue, totalOrders, avgOrderValue
 * - status breakdown
 */
router.get('/dashboard/business-metrics', async (req, res, next) => {
  try {
    const orders = req.db.collection('orders');

    const [agg] = await orders.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amounts.total' },
          totalOrders: { $sum: 1 },
          avgOrderValue: { $avg: '$amounts.total' },
        },
      },
    ]).toArray();

    const statusBreakdown = await orders.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]).toArray();

    res.json({
      totalRevenue: agg?.totalRevenue || 0,
      totalOrders: agg?.totalOrders || 0,
      avgOrderValue: Math.round(agg?.avgOrderValue || 0),
      statusBreakdown,
    });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/dashboard/performance
 * - simple process metrics (no external deps)
 */
router.get('/dashboard/performance', async (_req, res, next) => {
  try {
    const now = Date.now();
    const startedAt = new Date(now - Math.floor(process.uptime() * 1000));
    const mem = process.memoryUsage();

    res.json({
      startedAt,
      uptimeSec: Math.round(process.uptime()),
      memory: {
        rss: mem.rss,
        heapTotal: mem.heapTotal,
        heapUsed: mem.heapUsed,
        external: mem.external,
      },
      pid: process.pid,
      node: process.version,
    });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/dashboard/assistant-stats
 * - returns empty shape if collection doesn't exist yet
 */
router.get('/dashboard/assistant-stats', async (req, res, next) => {
  try {
    const coll = req.db.collection('assistant_logs');
    // if the collection is absent, countDocuments() will throw — swallow it
    const count = await coll.countDocuments().catch(() => 0);

    if (!count) {
      return res.json({
        intents: [],
        totals: { calls: 0, failures: 0, avgLatencyMs: 0 },
      });
    }

    const intents = await coll.aggregate([
      { $group: { _id: '$intent', count: { $sum: 1 }, avgLatencyMs: { $avg: '$latencyMs' } } },
      { $sort: { count: -1 } },
    ]).toArray();

    const [totals] = await coll.aggregate([
      { $group: { _id: null, calls: { $sum: 1 }, failures: { $sum: { $cond: ['$error', 1, 0] } }, avgLatencyMs: { $avg: '$latencyMs' } } },
    ]).toArray();

    res.json({ intents, totals: totals || { calls: 0, failures: 0, avgLatencyMs: 0 } });
  } catch (e) {
    next(e);
  }
});

export default router;
