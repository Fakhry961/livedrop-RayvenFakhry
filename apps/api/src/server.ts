// src/server.ts
import "dotenv/config";
import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import productsRouterOrFactory from "./routes/products.js";
import customersRouter from "./routes/customers.js";
import ordersRouter from "./routes/orders.js";
import analyticsRouter from "./routes/analytics.js";

const PORT = Number(process.env.PORT || 3001);

// CORS_ORIGINS from .env: comma separated
const origins = process.env.CORS_ORIGINS?.split(",").map(s => s.trim());

async function main() {
  const app = express();
  app.use(express.json());
  app.use(cors({ origin: origins || true }));

  // Mongo
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/livedrop';
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(); // DB name comes from the URI
  console.log(`✅ Mongo connected: ${db.databaseName}`);

  // Health
  app.get("/health", (_req, res) => {
    res.json({ ok: true, db: db.databaseName });
  });

  // Routes
  // products route may export a factory (db => router) or a router directly.
  const productsRouter = typeof productsRouterOrFactory === 'function'
    ? productsRouterOrFactory(db)
    : productsRouterOrFactory;
  app.use("/api/products", productsRouter);
  app.use("/api/customers", customersRouter);
  app.use("/api/orders", ordersRouter);
  app.use("/api/analytics", analyticsRouter);

  app.listen(PORT, () => {
    console.log(`🚀 API on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
