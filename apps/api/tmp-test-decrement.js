import { MongoClient } from 'mongodb';

(async () => {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017');
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB_NAME || 'livedrop');
    const sku = 'sku-001';
    const before = await db.collection('products').findOne({ id: sku });
    console.log('Before:', before);
    const r = await db.collection('products').findOneAndUpdate(
      { id: sku, stockQty: { $gte: 1 } },
      { $inc: { stockQty: -1 } },
      { returnDocument: 'after' }
    );
    console.log('Update result:', r && r.value ? r.value : r);
    const after = await db.collection('products').findOne({ id: sku });
    console.log('After:', after);
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
})();
