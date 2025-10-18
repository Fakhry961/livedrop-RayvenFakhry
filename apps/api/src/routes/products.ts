// src/routes/products.ts
import { Router } from "express";
import type { Db } from "mongodb";

export default function createProductsRouter(db: Db) {
  const r = Router();
  const col = db.collection("products");

  // GET /api/products?page=1&limit=20
  r.get("/", async (req, res) => {
    const page = Math.max(parseInt(String(req.query.page || "1"), 10), 1);
    const limit = Math.max(parseInt(String(req.query.limit || "20"), 10), 1);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      col.find({}).skip(skip).limit(limit).sort({ _id: -1 }).toArray(),
      col.countDocuments({}),
    ]);

    res.json({ items, page, limit, total });
  });

  // POST /api/products
  r.post("/", async (req, res) => {
    const { name, price, stock } = req.body || {};
    if (!name) return res.status(400).json({ error: "name is required" });

    const doc = {
      name: String(name),
      price: Number(price ?? 0),
      stock: Number(stock ?? 0),
      createdAt: new Date(),
    };
    const result = await col.insertOne(doc);
    res.status(201).json({ id: result.insertedId, ...doc });
  });

  return r;
}
