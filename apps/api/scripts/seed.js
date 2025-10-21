// --- Load environment first ---
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

/* eslint-disable no-console */
const fs = require('fs');
const { MongoClient, ObjectId } = require('mongodb');

// ---------- Config ----------
const DB_URI =
  process.env.MONGODB_URI ||
  process.env.MONGO_URL ||
  'mongodb://127.0.0.1:27017/livedrop';

// Target counts (randomized within ranges for realism)
const PRODUCT_MIN = 20, PRODUCT_MAX = 30;
const CUSTOMER_MIN = 10, CUSTOMER_MAX = 15;
const ORDER_MIN = 15, ORDER_MAX = 20;

const ORDER_STATUSES = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

// ---------- Helpers ----------
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const sample = (arr) => arr[Math.floor(Math.random() * arr.length)];
const sampleN = (arr, n) => {
  const copy = [...arr];
  const out = [];
  for (let i = 0; i < n && copy.length; i++) {
    out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
  }
  return out;
};
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};
const clampDateOrder = (createdAt, status) => {
  const deltaHrs = { PENDING: 1, PROCESSING: 6, SHIPPED: 48, DELIVERED: 96, CANCELLED: 12 }[status] || 2;
  const updatedAt = new Date(createdAt.getTime() + randInt(1, deltaHrs) * 60 * 60 * 1000);
  return updatedAt > new Date() ? new Date() : updatedAt;
};

// Try to load products from storefront mock file, else synthesize
function tryLoadMockProducts() {
  const candidates = [
    path.resolve(process.cwd(), 'apps/storefront/public/mock-catalog.json'),
    path.resolve(process.cwd(), 'apps/storefront/public/mock-catalog.js'),
    path.resolve(process.cwd(), 'apps/storefront/public/catalog.json'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      try {
        const data = require(p);
        if (Array.isArray(data) && data.length) {
          console.log(`Loaded ${data.length} products from ${p}`);
          return data;
        }
      } catch (e) {
        console.warn(`Could not parse ${p}:`, e.message);
      }
    }
  }
  return null;
}

function synthesizeProducts(count) {
  const nouns = [
    'T-Shirt','Hoodie','Cap','Backpack','Notebook','Mug','Bottle','Sticker Pack',
    'Keychain','Poster','Mousepad','Phone Case','Socks','Beanie','Wallet','Sunglasses',
    'Desk Mat','Pen Set','Umbrella','Cable Organizer','Charging Dock','Laptop Sleeve',
    'LED Lamp','Travel Pouch','Notebook Pro','Athletic Tee','Crewneck','Windbreaker'
  ];
  const tags = ['new','bestseller','limited','eco','sale','classic'];
  const categories = ['apparel','accessories','desk','drinkware','tech','travel'];

  const items = [];
  for (let i = 0; i < count; i++) {
    const name = sample(nouns) + (Math.random() < 0.25 ? ` ${randInt(2, 9)}.0` : '');
    const price = randInt(5, 120) * 100;
    const stock = randInt(10, 300);
    const sku = `SKU-${String(i + 1).padStart(4, '0')}`;
    items.push({
      _id: new ObjectId(),
      name,
      sku,
      price,
      currency: 'USD',
      category: sample(categories),
      tags: sampleN(tags, randInt(1, 3)),
      stock,
      image: `/images/${sku}.png`,
      createdAt: daysAgo(randInt(3, 21)),
      updatedAt: new Date(),
      active: true,
    });
  }
  return items;
}

function normalizeIncomingProducts(arr, count) {
  const out = [];
  for (let i = 0; i < arr.length && out.length < count; i++) {
    const p = arr[i] || {};
    out.push({
      _id: new ObjectId(),
      name: p.name || p.title || `Product ${i + 1}`,
      sku: p.sku || `SKU-${String(i + 1).padStart(4, '0')}`,
      price: typeof p.price === 'number' ? Math.round(p.price * (p.price < 1000 ? 100 : 1)) : randInt(10, 90) * 100,
      currency: p.currency || 'USD',
      category: p.category || p.type || 'general',
      tags: Array.isArray(p.tags) ? p.tags.slice(0, 3) : ['classic'],
      stock: typeof p.stock === 'number' ? p.stock : randInt(20, 200),
      image: p.image || p.img || `/images/SKU-${String(i + 1).padStart(4, '0')}.png`,
      createdAt: daysAgo(randInt(3, 21)),
      updatedAt: new Date(),
      active: p.active !== false,
    });
  }
  return out;
}

function generateCustomers(count) {
  const firstNames = ['Alex','Sam','Taylor','Jordan','Avery','Riley','Casey','Drew','Morgan','Quinn','Skyler','Reese','Rowan','Shawn','Jamie','Parker'];
  const lastNames  = ['Lee','Doe','Kim','Singh','Garcia','Patel','Nguyen','Khan','Brown','Smith','Martinez','Wong','Hernandez','Kumar','Chen','Ibrahim'];
  const domains    = ['example.com','shopper.io','mail.com','inbox.test'];

  const customers = [{
    _id: new ObjectId(),
    name: 'Demo User',
    email: 'demo@example.com',
    createdAt: daysAgo(randInt(1, 14)),
    updatedAt: new Date(),
    address: { country: 'US' }
  }];

  while (customers.length < count) {
    const f = sample(firstNames);
    const l = sample(lastNames);
    const email = `${f}.${l}${randInt(1, 999)}`.toLowerCase() + '@' + sample(domains);
    customers.push({
      _id: new ObjectId(),
      name: `${f} ${l}`,
      email,
      createdAt: daysAgo(randInt(3, 21)),
      updatedAt: new Date(),
      address: { country: sample(['US','CA','UK','DE','FR','IN','SG','AE','AU']) }
    });
  }
  return customers;
}

function generateOrders(count, customers, products) {
  const orders = [];
  for (let i = 0; i < count; i++) {
    const customer = sample(customers);
    const itemCount = randInt(1, 4);
    const selectedProducts = sampleN(products, itemCount);
    const items = selectedProducts.map(p => ({
      productId: p._id,
      name: p.name,
      price: p.price,
      qty: randInt(1, 3),
    }));
    const createdAt = daysAgo(randInt(0, 21));
    const status = sample(ORDER_STATUSES);
    const updatedAt = clampDateOrder(createdAt, status);

    const subtotal = items.reduce((sum, it) => sum + it.price * it.qty, 0);
    const shipping = subtotal > 8000 ? 0 : 799;
    const tax = Math.round(subtotal * 0.07);

    orders.push({
      _id: new ObjectId(),
      customerId: customer._id,
      items,
      status,
      amounts: {
        subtotal,
        shipping,
        tax,
        total: subtotal + shipping + tax,
        currency: 'USD'
      },
      notes: i % 7 === 0 ? 'Gift wrap requested' : '',
      createdAt,
      updatedAt,
      shippingInfo: {
        carrier: sample(['UPS','FedEx','DHL','USPS']),
        tracking: `TRK${randInt(10000000,99999999)}`
      }
    });
  }

  const demo = customers.find(c => c.email === 'demo@example.com');
  if (demo && !orders.some(o => o.customerId.equals(demo._id))) {
    const p = sample(products);
    orders.push({
      _id: new ObjectId(),
      customerId: demo._id,
      items: [{ productId: p._id, name: p.name, price: p.price, qty: 2 }],
      status: 'PROCESSING',
      amounts: { subtotal: p.price * 2, shipping: 0, tax: Math.round(p.price * 2 * 0.07), total: Math.round(p.price * 2 * 1.07), currency: 'USD' },
      notes: 'Demo seeded order',
      createdAt: daysAgo(2),
      updatedAt: new Date(),
      shippingInfo: { carrier: 'UPS', tracking: `TRK${randInt(10000000,99999999)}` }
    });
  }

  ORDER_STATUSES.forEach((st) => {
    if (!orders.some(o => o.status === st)) {
      const any = sample(orders);
      any.status = st;
      any.updatedAt = clampDateOrder(any.createdAt, st);
    }
  });

  return orders;
}

// ---------- Main ----------
async function main() {
  const client = new MongoClient(DB_URI);
  await client.connect();
  const db = client.db();
  console.log('Connected to Mongo:', db.databaseName);

  await Promise.all([
    db.collection('products').deleteMany({}),
    db.collection('customers').deleteMany({}),
    db.collection('orders').deleteMany({}),
  ]);

  const targetProducts = randInt(PRODUCT_MIN, PRODUCT_MAX);
  const incoming = tryLoadMockProducts();
  const products = incoming
    ? normalizeIncomingProducts(incoming, targetProducts)
    : synthesizeProducts(targetProducts);

  const customers = generateCustomers(randInt(CUSTOMER_MIN, CUSTOMER_MAX));
  const orders = generateOrders(randInt(ORDER_MIN, ORDER_MAX), customers, products);

  await db.collection('products').insertMany(products);
  await db.collection('customers').insertMany(customers);
  await db.collection('orders').insertMany(orders);

  await db.collection('orders').createIndex({ customerId: 1, createdAt: -1 });
  await db.collection('products').createIndex({ name: 'text', category: 1 });
  await db.collection('customers').createIndex({ email: 1 }, { unique: true });

  console.log(`Seeded products: ${products.length}`);
  console.log(`Seeded customers: ${customers.length} (includes demo@example.com)`);
  console.log(`Seeded orders: ${orders.length}`);
  console.log('Example IDs:', {
    productId: String(products[0]._id),
    customerId: String(customers[0]._id),
    orderId: String(orders[0]._id),
  });

  await client.close();
  console.log('Done seeding.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
