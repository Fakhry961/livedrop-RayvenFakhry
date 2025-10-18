import { MongoClient } from 'mongodb';

/**
 * Simple singleton MongoDB connector.
 * - connectDb(): establishes connection once and returns the Db instance
 * - getDb(): returns the connected Db or throws if not connected
 * - getCollection(name): convenience to get a collection
 * - models: small helpers for common collections
 */

let client;
let db;

export async function connectDb() {
  if (db) return db;
  const uri = process.env.MONGODB_URI || '';
  client = new MongoClient(uri);
  await client.connect();
  // Allow optional DB name override via MONGODB_DB_NAME, otherwise use the DB from the URI
  const dbName = process.env.MONGODB_DB_NAME || undefined;
  db = client.db(dbName);
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
  products: () => getCollection('products'),
  orders: () => getCollection('orders'),
};

export default { connectDb, getDb, getCollection, models };
