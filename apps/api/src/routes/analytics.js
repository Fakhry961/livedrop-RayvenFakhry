// apps/api/src/routes/analytics.js
import { Router } from "express";

const router = Router();

function startOfLocalDay(d = new Date()) {
  const t = new Date(d);
  t.setHours(0, 0, 0, 0);
  return t;
}

function addDays(d, n) {
  const t = new Date(d);
  t.setDate(t.getDate() + n);
  return t;
}

/**
 * GET /api/analytics/daily-revenue?days=7
 * Returns { points: [{ date: "YYYY-MM-DD", revenue: number }, ...] }
 */
router.get("/analytics/daily-revenue", async (req, res, next) => {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days, 10) || 7, 1), 365);

    // Start at local midnight (N-1 days ago)
    const end = startOfLocalDay(new Date());               // today 00:00
    const start = addDays(end, -(days - 1));               // (days-1) days back 00:00

    // Aggregate revenue per local day from orders
    const raw = await req.db
      .collection("orders")
      .aggregate([
        { $match: { createdAt: { $gte: start } } },
        {
          $group: {
            _id: {
              $dateToString: {
                date: "$createdAt",
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
                format: "%Y-%m-%d",
              },
            },
            revenue: { $sum: "$amounts.total" },
          },
        },
        { $project: { _id: 0, date: "$_id", revenue: 1 } },
      ])
      .toArray();

    const map = new Map(raw.map((r) => [r.date, Number(r.revenue || 0)]));

    // Build a full, contiguous window with zeros for missing dates
    const points = [];
    for (let i = 0; i < days; i++) {
      const d = addDays(start, i);
      const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
      points.push({ date: key, revenue: map.get(key) || 0 });
    }

    res.json({ points });
  } catch (e) {
    next(e);
  }
});

export default router;
