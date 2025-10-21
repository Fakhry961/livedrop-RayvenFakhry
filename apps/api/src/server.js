import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";

// Routers
import productsRouter from "./routes/products.js";
import ordersRouter from "./routes/orders.js";
import customersRouter from "./routes/customers.js";
import analyticsRouter from "./routes/analytics.js";
import dashboardRouter from "./routes/dashboard.js"; // optional if you have it

// Middleware (optional but recommended)
import { errorHandler } from "./middleware/errorHandler.js";
import { metricsMiddleware } from "./middleware/metrics.js";

// Load environment variables
dotenv.config();

const app = express();

// ---------- Middleware ----------
const origins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
app.use(cors({ origin: origins.length ? origins : undefined }));

app.use(express.json());
app.use(metricsMiddleware);

// ---------- MongoDB ----------
const mongoUri =
  process.env.MONGODB_URI ||
  process.env.MONGO_URL ||
  "mongodb://127.0.0.1:27017/livedrop";

const DB_NAME = process.env.MONGODB_DB_NAME || process.env.DB_NAME || "livedrop";
const client = new MongoClient(mongoUri);
let db;

async function connectDB() {
  try {
    await client.connect();
    db = client.db(DB_NAME);
    const host = mongoUri.split("@")[1]?.split("/")[0] || "127.0.0.1:27017";
    console.log(`✅ Mongo connected: ${db.databaseName} @ ${host}`);
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
}

// Attach DB to all requests
app.use((req, _res, next) => {
  req.db = db;
  next();
});

// ---------- Health Routes ----------

// Root route with HTML homepage
app.get("/", (req, res) => {
  res.send(`
    <h1>🚀 LiveDrop API</h1>
    <p>Available routes:</p>
    <ul>
      <li>GET /api/health</li>
      <li>GET /api/products</li>
      <li>GET /api/dashboard</li>
      <li>GET /api/orders</li>
      <li>GET /api/customers</li>
      <li>GET /api/analytics/daily-revenue</li>
    </ul>
  `);
});

// JSON health endpoint for API checks
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    ok: true,
    status: "healthy",
    now: new Date(),
    env: process.env.NODE_ENV || "development",
  });
});

// ---------- API Routes ----------
app.use("/api", productsRouter);
app.use("/api", ordersRouter);
app.use("/api", customersRouter);
app.use("/api", analyticsRouter);
app.use("/api", dashboardRouter); // optional

// ---------- 404 Handler ----------
app.use((_req, res) => {
  res.status(404).json({ error: { code: 404, message: "Not Found" } });
});

// ---------- Error Handler ----------
app.use(errorHandler);

// ---------- Start Server ----------
const PORT = process.env.PORT || 3001;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 API running on http://localhost:${PORT}`);
  });
});

// Graceful shutdown (optional)
process.on("SIGINT", async () => {
  try {
    await client.close();
    console.log("🛑 Mongo connection closed");
  } finally {
    process.exit(0);
  }
});
