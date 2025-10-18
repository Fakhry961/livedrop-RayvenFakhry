import { MongoClient, type Db } from 'mongodb';
import 'dotenv/config';

let client: MongoClient | undefined;
let db: Db | undefined;

/** Connect once and reuse the singleton Db */
export async function connectDb(): Promise<Db> {
  if (db) return db;

  const uri = process.env.MONGODB_URI || process.env.MONGO_URL;
  if (!uri) {
    throw new Error('Missing MONGODB_URI (or MONGO_URL) in /apps/api/.env');
  }

  client = new MongoClient(uri);
  await client.connect();

  // If your URI ends with a DB name (e.g., .../livedrop) it will use that.
  // Otherwise Mongo/Atlas defaults to "test".
  db = client.db();
  console.log('✅ Mongo connected:', db.databaseName);
  return db;
}

/** Get the already-initialized Db (after connectDb() ran) */
export function getDb(): Db {
  if (!db) throw new Error('DB not initialized. Call connectDb() first.');
  return db;
}
