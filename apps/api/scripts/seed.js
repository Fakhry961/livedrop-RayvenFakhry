const { MongoClient, ObjectId } = require('mongodb');

async function main() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/livedrop';
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();
  console.log('Connected to Mongo:', db.databaseName);

  // Clear existing demo collections (safe for local dev)
  await Promise.all([
    db.collection('products').deleteMany({}),
    db.collection('customers').deleteMany({}),
    db.collection('orders').deleteMany({}),
  ]);

  const products = [
    { name: 'T-shirt', price: 1999, stock: 100, createdAt: new Date() },
    { name: 'Coffee Mug', price: 1299, stock: 50, createdAt: new Date() },
    { name: 'Sticker Pack', price: 499, stock: 200, createdAt: new Date() },
  ];

  const customers = [
    { name: 'Alex Doe', email: 'alex@example.com', createdAt: new Date() },
    { name: 'Sam Lee', email: 'sam@example.com', createdAt: new Date() },
  ];

  const { insertedIds: prodIds } = await db.collection('products').insertMany(products);
  const { insertedIds: custIds } = await db.collection('customers').insertMany(customers);

  const orders = [
    {
      customerId: custIds['0'],
      items: [
        { productId: prodIds['0'], qty: 2 },
        { productId: prodIds['2'], qty: 3 },
      ],
      status: 'PENDING',
      notes: 'Demo order',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const { insertedIds: orderIds } = await db.collection('orders').insertMany(orders);

  console.log('Seeded products:', Object.values(prodIds).map(String));
  console.log('Seeded customers:', Object.values(custIds).map(String));
  console.log('Seeded orders:', Object.values(orderIds).map(String));

  await client.close();
  console.log('Done seeding.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
