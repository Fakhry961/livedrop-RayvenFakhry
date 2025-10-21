export default function orderSSE(req, res) {
  const { orderId } = req.params;

  // Mirror Access-Control-Allow-Origin for EventSource clients.
  const rawOrigins = process.env.CORS_ORIGINS || "";
  const allowed = rawOrigins.split(",").map(s => s.trim()).filter(Boolean);
  const origin = req.headers.origin || "*";

  if (allowed.length > 0) {
    if (allowed.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    } else {
      // If not allowed, skip setting header — browser will block.
    }
  } else {
    // No explicit allowed list — allow requesting origin or wildcard.
    res.setHeader("Access-Control-Allow-Origin", origin || "*");
  }

  // SSE headers
  res.set({
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "Content-Type": "text/event-stream"
  });

  // Initial message to client
  res.write(`event: open\ndata: Connected to order ${orderId}\n\n`);

  // Mock status updates every 3 seconds
  const iv = setInterval(() => {
    const statuses = ["created", "processing", "shipped", "delivered"];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    res.write(`event: status\ndata: ${JSON.stringify({ orderId, status, ts: Date.now() })}\n\n`);
  }, 3000);

  req.on("close", () => {
    clearInterval(iv);
  });
}
