import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient, ObjectId } from "mongodb";
import jwt from "jsonwebtoken";

// Routers
import productsRouter from "./routes/products.js";
import ordersRouter from "./routes/orders.js";
import customersRouter from "./routes/customers.js";
import analyticsRouter from "./routes/analytics.js";
import dashboardRouter from "./routes/dashboard.js";
import assistantRouter from "./routes/assistant.js";
import orderStatusStream from "./sse/order-status.js";

// Middleware
import { errorHandler } from "./middleware/errorHandler.js";
import { metricsMiddleware } from "./middleware/metrics.js";

dotenv.config();

const app = express();
app.set("trust proxy", true);

/* ---------------------------- CORS ---------------------------- */
const ALLOWED_ORIGINS = [
  process.env.CORS_ORIGIN,
  process.env.cors_origin,
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
  "https://livedrop-rayvenfakhry.vercel.app",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      cb(new Error(`CORS blocked: ${origin}`));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.options("*", cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(metricsMiddleware);

/* ---------------------------- DB ---------------------------- */
const mongoUri =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/livedrop";
const client = new MongoClient(mongoUri);
let db;

async function connectDB() {
  await client.connect();
  db = client.db(process.env.MONGODB_DB_NAME || "livedrop");
  console.log(`✅ MongoDB connected: ${db.databaseName}`);
}
app.use((req, _res, next) => {
  req.db = db;
  next();
});

/* ---------------------------- AUTH ---------------------------- */
// helper: create JWT
function createToken(user) {
  return jwt.sign(
    { sub: String(user._id), email: user.email },
    process.env.JWT_SECRET || "dev-secret",
    { expiresIn: "7d" }
  );
}

// login
app.post("/api/login", async (req, res, next) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    if (!email || !email.includes("@"))
      return res.status(400).json({ error: "Valid email required" });

    const customers = req.db.collection("customers");
    const user = await customers.findOne({ email });
    // Do NOT auto-create users — only existing DB users are allowed to sign in
    if (!user) {
      return res.status(404).json({ error: "No account found for that email" });
    }

    const token = createToken(user);
    res.json({ token, customer: user });
  } catch (err) {
    next(err);
  }
});

// alias for older frontend versions
app.post("/api/auth/login", (req, res, next) => {
  req.url = "/api/login";
  app._router.handle(req, res, next);
});

// verify current user
app.get("/api/me", async (req, res) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer "))
      return res.status(401).json({ error: "Missing token" });

    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev-secret");
    const user = await req.db
      .collection("customers")
      .findOne({ _id: new ObjectId(decoded.sub) });

    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(401).json({ error: "Invalid or expired token" });
  }
});

/* ---------------------------- ROUTES ---------------------------- */
app.use("/api", productsRouter);
app.use("/api", ordersRouter);
app.use("/api", customersRouter);
app.use("/api", analyticsRouter);
app.use("/api", dashboardRouter);
app.use("/api", assistantRouter);
app.use("/api", orderStatusStream);

/* ---------------------------- HEALTH ---------------------------- */
app.get("/api/health", (_req, res) =>
  res.json({ ok: true, allow: ALLOWED_ORIGINS })
);

/* ---------------------------- ERRORS ---------------------------- */
app.use((_req, res) => res.status(404).json({ error: "Not found" }));
app.use(errorHandler);

/* ---------------------------- START ---------------------------- */
const PORT = process.env.PORT || 3001;
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 API at http://localhost:${PORT}`);
    console.log("🌐 CORS allowlist:", ALLOWED_ORIGINS);
  });
});
