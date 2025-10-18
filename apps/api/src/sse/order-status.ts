import { Request, Response } from "express";

export default function orderSSE(req: Request, res: Response) {
  const { orderId } = req.params as { orderId: string };

  // Mirror Access-Control-Allow-Origin for EventSource clients. If the server
  // has CORS_ORIGINS configured, use it; otherwise allow the request origin.
  const rawOrigins = process.env.CORS_ORIGINS || "";
  const allowed = rawOrigins.split(",").map(s => s.trim()).filter(Boolean);
  const origin = (req.headers.origin as string) || "*";
  if (allowed.length > 0) {
    if (allowed.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    } else {
      // don't set the header if origin isn't allowed; browser will block
    }
  } else {
    // no explicit allowed list; allow the requesting origin (or wildcard)
    res.setHeader("Access-Control-Allow-Origin", origin || "*");
  }

  res.set({
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Content-Type": "text/event-stream",
  });

  res.write(`event: open\ndata: Connected to order ${orderId}\n\n`);

  // Send a mock status update every 3 seconds (server would manage lifecycle in real code)
  const iv = setInterval(() => {
    const status = ["created", "processing", "shipped", "delivered"][Math.floor(Math.random() * 4)];
    res.write(`event: status\ndata: ${JSON.stringify({ orderId, status, ts: Date.now() })}\n\n`);
  }, 3000);

  req.on("close", () => {
    clearInterval(iv);
  });
}
