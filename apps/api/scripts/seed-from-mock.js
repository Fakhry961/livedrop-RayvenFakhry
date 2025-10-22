#!/usr/bin/env node
/* Seed the API MongoDB from the storefront public/mock-catalog.json file.

Usage:
  cd apps/api
  MONGODB_URI=mongodb://127.0.0.1:27017/livedrop node scripts/seed-from-mock.js
*/
const { MongoClient } = require('mongodb');
const path = require('path');
const fs = require('fs');

async function main(){
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/livedrop';
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();
  console.log('Connected to', uri, 'db:', db.databaseName);

  const mockPath = path.join(__dirname, '..', 'storefront', 'public', 'mock-catalog.json');
  if (!fs.existsSync(mockPath)){
    console.error('mock catalog not found at', mockPath);
    process.exit(1);
  }
  const raw = fs.readFileSync(mockPath,'utf8');
  const items = JSON.parse(raw);
  if (!Array.isArray(items)){
    console.error('mock catalog is not an array');
    process.exit(1);
  }

  const col = db.collection('products');
  console.log('Clearing products collection...');
  await col.deleteMany({});

  // Normalize fields and insert
  const docs = items.map(p => ({
    sku: p.id,
    title: p.title,
    price: Math.round((p.price || 0) * 100), // store as cents
    image: p.image,
    tags: p.tags || [],
    stockQty: p.stockQty || 0,
    desc: p.desc || '',
    createdAt: new Date(),
  }));

  const r = await col.insertMany(docs);
  console.log('Inserted', Object.keys(r.insertedIds).length, 'products');
  await client.close();
  console.log('Done');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
