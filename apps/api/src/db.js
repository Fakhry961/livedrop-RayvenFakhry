// apps/api/src/db.js
import 'dotenv/config';
import { MongoClient } from 'mongodb';

let client;
let db;

function pickMongoUri() {
  const uri = (process.env.MONGODB_URI || process.env.MONGO_URL || '').trim();
  // Fallback to local if not provided
  if (!uri) return 'mongodb://127.0.0.1:27017/livedrop';
  return uri;
}

export async function connectDb() {
  if (db) return db;

  const uri = pickMongoUri();

  // Validate scheme to avoid MongoParseError
  if (!/^mongodb(\+srv)?:\/\//i.test(uri)) {
    throw new Error(
      `Invalid MONGODB_URI: "${uri}". It must start with "mongodb://" or "mongodb+srv://".`
    );
  }

  client = new MongoClient(uri);
  await client.connect();

  // Allow optional override, else use DB from URI
  const dbName = process.env.MONGODB_DB_NAME || process.env.DB_NAME || undefined;
  db = client.db(dbName);

  // Light log (don’t print credentials)
  const host = uri.split('@')[1]?.split('/')[0] || '127.0.0.1:27017';
  console.log(`✅ Mongo connected: ${db.databaseName || '(default)'} @ ${host}`);
  return db;
}

export function getDb() {
  if (!db) throw new Error('DB not initialized. Call connectDb() first.');
  return db;
}

export function getCollection(name) {
  return getDb().collection(name);
}

export const models = {
  customers: () => getCollection('customers'),
  products:  () => getCollection('products'),
  orders:    () => getCollection('orders'),
};

export default { connectDb, getDb, getCollection, models };
