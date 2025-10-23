// apps/api/src/routes/dashboard.js
import { Router } from "express";

const router = Router();

function atStartOfLocalDay() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

async function buildSummary(db) {
  const [ordersTotal, productsTotal, customersTotal] = await Promise.all([
    db.collection("orders").countDocuments({}),
    db.collection("products").countDocuments({}),
    db.collection("customers").countDocuments({}),
  ]);

  // "today" = from local midnight
  const sinceMidnight = atStartOfLocalDay();

  // KPIs for today
  const todayAgg = await db
    .collection("orders")
    .aggregate([
      { $match: { createdAt: { $gte: sinceMidnight } } },
      { $group: { _id: null, revenue: { $sum: "$amounts.total" }, count: { $sum: 1 } } },
    ])
    .toArray();

  // keep last 24h variant around (not shown in UI right now)
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const last24hAgg = await db
    .collection("orders")
    .aggregate([
      { $match: { createdAt: { $gte: last24h } } },
      { $group: { _id: null, revenue: { $sum: "$amounts.total" }, count: { $sum: 1 } } },
    ])
    .toArray();

  // recent orders (lightweight shape for the table)
  const recent = await db
    .collection("orders")
    .find({})
    .sort({ createdAt: -1 })
    .limit(5)
    .project({ items: 1, amounts: 1, status: 1, createdAt: 1 })
    .toArray();

  // low stock (<= 3)
  const lowStock = await db
    .collection("products")
    .find({ stockQty: { $lte: 3 } })
    .project({ id: 1, title: 1, stockQty: 1 })
    .limit(10)
    .toArray();

  // Top products today (by units). Orders store items like: { sku, qty, price, title? }
  const topProductsAgg = await db
    .collection("orders")
    .aggregate([
      { $match: { createdAt: { $gte: sinceMidnight } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.sku",
          units: { $sum: "$items.qty" },
          revenue: { $sum: { $multiply: ["$items.qty", "$items.price"] } },
          // keep the most common title we saw (fallback to SKU on the UI)
          titleSample: { $addToSet: "$items.title" },
        },
      },
      { $sort: { units: -1, revenue: -1 } },
      { $limit: 10 },
    ])
    .toArray();

  const topProducts = topProductsAgg.map((p) => ({
    id: p._id,
    title: Array.isArray(p.titleSample) ? (p.titleSample.find(Boolean) ?? undefined) : undefined,
    units: Number(p.units || 0),
    revenue: Number(p.revenue || 0),
  }));

  // Flatten keys to what the frontend expects, but keep the old structure for back-compat
  const ordersToday = Number(todayAgg[0]?.count ?? 0);
  const revenueToday = Number(todayAgg[0]?.revenue ?? 0);

  return {
    // legacy structure (kept so nothing else breaks)
    counts: {
      orders: ordersTotal,
      products: productsTotal,
      customers: customersTotal,
    },
    today: {
      orders: ordersToday,
      revenue: revenueToday,
    },
    last24h: {
      orders: Number(last24hAgg[0]?.count ?? 0),
      revenue: Number(last24hAgg[0]?.revenue ?? 0),
    },

    // flattened fields the UI reads
    ordersToday,
    revenueToday,
    customersTotal: customersTotal,

    // panels
    recentOrders: recent,
    lowStock,
    topProducts,
  };
}

// canonical path
router.get("/dashboard/summary", async (req, res, next) => {
  try {
    const data = await buildSummary(req.db);
    res.json(data);
  } catch (e) {
    next(e);
  }
});

// path used by the frontend
router.get("/dashboard/overview", async (req, res, next) => {
  try {
    const data = await buildSummary(req.db);
    res.json(data);
  } catch (e) {
    next(e);
  }
});

export default router;
