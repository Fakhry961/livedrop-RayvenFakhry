// apps/api/src/routes/auth.js
import { Router } from "express";
import jwt from "jsonwebtoken";

// expects req.db (Mongo) injected by server.js
const router = Router();

function signToken(payload, opts = {}) {
  const secret = process.env.JWT_SECRET || "dev-secret-change-me";
  // 7 days by default
  return jwt.sign(payload, secret, { expiresIn: "7d", ...opts });
}

// POST /api/auth/login  { email: string }
router.post("/auth/login", async (req, res, next) => {
  try {
    const email = String((req.body?.email || "")).trim().toLowerCase();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ error: { code: 400, message: "Invalid email" } });
    }

    const customers = req.db.collection("customers");
    let customer = await customers.findOne({ email });
    if (!customer) {
      // create a minimal customer on first login
      const now = new Date();
      const doc = { email, createdAt: now, updatedAt: now };
      const { insertedId } = await customers.insertOne(doc);
      customer = { _id: insertedId, ...doc };
    }

    const token = signToken({ sub: customer._id.toString(), email });
    res.json({
      token,
      customer: {
        id: customer._id.toString(),
        email: customer.email,
      },
    });
  } catch (e) {
    next(e);
  }
});

export default router;
