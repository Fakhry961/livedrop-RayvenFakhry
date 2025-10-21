import express from "express";
import { answer } from "../assistant/engine.js";

const router = express.Router();

// POST /api/assistant/generate
router.post("/assistant/generate", async (req, res) => {
  try {
    const query = String(req.body?.query ?? "");
    const { text, meta } = await answer(query);
    res.json({ text, meta });
  } catch (e) {
    res.status(502).json({ error: String(e.message || e) });
  }
});

export default router;
