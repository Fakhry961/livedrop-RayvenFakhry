import { Router } from "express";
import { answer } from "../assistant/engine.js";

const router = Router();

// Quick health check for your frontend
router.get("/assistant/health", (_req, res) => {
  res.json({ ok: true, service: "assistant" });
});

// Stable generation route used by the storefront “Ask Support” widget
router.post("/assistant/generate", async (req, res) => {
  try {
    const query = String(req.body?.query ?? req.body?.prompt ?? "").trim();
    if (!query) return res.status(400).json({ error: "Missing query" });

    const { text, meta } = await answer(query);
    res.json({ text, meta });
  } catch (e) {
    res.status(502).json({ error: String(e.message || e) });
  }
});

export default router;
