#!/usr/bin/env node
/**
 * Load products from the storefront's mock-catalog.json
 * and insert them into your MongoDB.
 *
 * Usage:
 *   node scripts/seed-from-mock.mjs
 * or with pnpm:
 *   pnpm run seed:mock
 */

import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { MongoClient, ObjectId } from "mongodb";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const DB_URI =
  process.env.MONGODB_URI ||
  process.env.MONGO_URL ||
  "mongodb://127.0.0.1:27017/livedrop";

const DB_NAME =
  process.env.MONGODB_DB_NAME ||
  process.env.DB_NAME ||
  "livedrop";

// -----------------------------
async function main() {
  console.log("Connecting to MongoDB...");
  const client = new MongoClient(DB_URI);
  await client.connect();
  const db = client.db(DB_NAME);
  console.log("✅ Connected to", DB_NAME);

  // Find mock-catalog.json in your storefront
  const candidates = [
    path.resolve(process.cwd(), "../storefront/public/mock-catalog.json"),
    path.resolve(process.cwd(), "apps/storefront/public/mock-catalog.json"),
    path.resolve(process.cwd(), "public/mock-catalog.json"),
  ];

  let filePath = null;
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      filePath = p;
      break;
    }
  }

  if (!filePath) {
    console.error("❌ mock-catalog.json not found.");
    process.exit(1);
  }

  console.log("📦 Loading products from:", filePath);
  const raw = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(raw);

  if (!Array.isArray(data) || !data.length) {
    console.error("❌ mock-catalog.json is empty or invalid.");
    process.exit(1);
  }

  // Normalize products to your backend schema
  const products = data.map((p, i) => ({
    _id: new ObjectId(),
    id: p.id || `sku-${String(i + 1).padStart(3, "0")}`,
    title: p.title ?? p.name ?? `Product ${i + 1}`,
    price: typeof p.price === "number" ? p.price : Number(p.price || 0),
    image: p.image || "/placeholder.png",
    tags: Array.isArray(p.tags) ? p.tags : [],
    stockQty: p.stockQty ?? p.stock ?? 0,
    desc: p.desc || "",
    createdAt: new Date(),
    updatedAt: new Date(),
    active: true,
  }));

  await db.collection("products").deleteMany({});
  const res = await db.collection("products").insertMany(products);

  console.log(`✅ Inserted ${res.insertedCount} products`);
  console.log("Example product:", products[0].title);

  await client.close();
  console.log("🌱 Done seeding from mock catalog.");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
