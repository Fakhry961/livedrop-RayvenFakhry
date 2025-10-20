import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import { createServer } from "http";

// Routers
import productsRouter from "./routes/products.js";
import customersRouter from "./routes/customers.js";
import ordersRouter from "./routes/orders.js";
import analyticsRouter from "./routes/analytics.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI || "";
const client = new MongoClient(MONGODB_URI);

async function main() {
  try {
    await client.connect();
    const db = client.db("livedrop");
    console.log("✅ Mongo connected: livedrop");

    // --- Health check ---
    app.get("/health", (_req, res) => {
      res.status(200).json({ ok: true, uptime: process.uptime() });
    });

    // --- Root route (fixes “Cannot GET /”) ---
    app.get("/", (_req, res) => {
      res
        .status(200)
        .type("html")
        .send(`
          <h1>🟢 LiveDrop API</h1>
          <p>Server running successfully.</p>
          <ul>
            <li><a href="/health">/health</a> – Health check</li>
            <li><a href="/api/products">/api/products</a> – Products API</li>
            <li><a href="/api/customers">/api/customers</a> – Customers API</li>
            <li><a href="/api/orders">/api/orders</a> – Orders API</li>
            <li><a href="/api/analytics">/api/analytics</a> – Analytics API</li>
          </ul>
        `);
    });

    // --- API routes ---
    app.use("/api/products", productsRouter(db));
    app.use("/api/customers", customersRouter(db));
    app.use("/api/orders", ordersRouter(db));
    app.use("/api/analytics", analyticsRouter(db));

    // --- Start server ---
    const server = createServer(app);
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 API running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Server startup failed:", err);
    process.exit(1);
  }
}

main().catch(console.error);

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down gracefully...");
  await client.close();
  process.exit(0);
});
