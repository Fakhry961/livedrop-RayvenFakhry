// src/routes/analytics.ts
import { Router } from "express";
import type { Db } from "mongodb";

export default function createAnalyticsRouter(db: Db) {
  const r = Router();
  const orders = db.collection("orders");

  // GET /api/analytics/daily?from=YYYY-MM-DD&to=YYYY-MM-DD
  r.get("/daily", async (req, res) => {
    const from = req.query.from ? new Date(String(req.query.from)) : new Date("1970-01-01");
    const to = req.query.to ? new Date(String(req.query.to)) : new Date();

    // Example pipeline: sum revenue by day from order items (qty * price)
    const pipeline = [
      { $match: { createdAt: { $gte: from, $lte: to } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: { $multiply: ["$items.qty", "$items.price"] } },
          orders: { $addToSet: "$_id" },
        },
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          revenue: 1,
          orderCount: { $size: "$orders" },
        },
      },
      { $sort: { date: 1 } },
    ];

    const data = await orders.aggregate(pipeline).toArray();
    res.json(data);
  });

  return r;
}
