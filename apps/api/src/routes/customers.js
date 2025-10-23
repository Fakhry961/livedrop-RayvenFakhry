import { Router } from "express";
import { ObjectId } from "mongodb";

const router = Router();

// List customers (very simple demo endpoint)
router.get("/customers", async (req, res, next) => {
  try {
    const { page = 1, limit = 20, q = "" } = req.query;
    const lim = Math.min(Math.max(Number(limit), 1), 100);
    const skip = (Math.max(Number(page), 1) - 1) * lim;

    const filter = q ? { $text: { $search: String(q) } } : {};
    const coll = req.db.collection("customers");
    const [items, total] = await Promise.all([
      coll.find(filter).sort({ createdAt: -1 }).skip(skip).limit(lim).toArray(),
      coll.countDocuments(filter),
    ]);

    res.json({ items, total, page: Number(page), limit: lim, totalPages: Math.ceil(total / lim) });
  } catch (e) {
    next(e);
  }
});

// Create / upsert a customer by email
router.post("/customers", async (req, res, next) => {
  try {
    const { email, name = "" } = req.body || {};
    if (!email) return res.status(400).json({ error: "Missing email" });

    const now = new Date();
    const coll = req.db.collection("customers");
    const { value } = await coll.findOneAndUpdate(
      { email: String(email).toLowerCase() },
      {
        $setOnInsert: { createdAt: now },
        $set: { name, updatedAt: now },
      },
      { upsert: true, returnDocument: "after" }
    );
    res.status(201).json(value);
  } catch (e) {
    next(e);
  }
});

// Get a single customer
router.get("/customers/:id", async (req, res, next) => {
  try {
    const id = String(req.params.id || "").trim();
    if (!ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid id" });
    const doc = await req.db.collection("customers").findOne({ _id: new ObjectId(id) });
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (e) {
    next(e);
  }
});

export default router;
