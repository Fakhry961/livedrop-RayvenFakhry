import express from 'express';
import cors from 'cors';
import { connectDb } from './db.js';
import { errorHandler } from './middleware/errorHandler.js';
import { metricsMiddleware } from './middleware/metrics.js';

// Routes
import customers from './routes/customers.js';
import products from './routes/products.js';
import orders from './routes/orders.js';
import analytics from './routes/analytics.js';
import dashboard from './routes/dashboard.js';

const app = express();

// ---------- Middleware ----------
const origins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
app.use(cors({ origin: origins.length ? origins : undefined }));

app.use(express.json());
app.use(metricsMiddleware);

// ---------- Database ----------
const db = await connectDb();
app.use((req, _res, next) => {
  req.db = db;
  next();
});

// ---------- Health Check Routes ----------
// Root for Render’s health check
app.get('/', (_req, res) => {
  res.type('text/plain').send('OK');
});

// JSON health endpoint for tools/Postman
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    ok: true,
    now: new Date(),
    env: process.env.NODE_ENV || 'development'
  });
});

// ---------- API Routes ----------
app.use('/api', customers);
app.use('/api', products);
app.use('/api', orders);
app.use('/api', analytics);
app.use('/api', dashboard);

// ---------- 404 Handler ----------
app.use((_req, res) => {
  res.status(404).json({ error: { code: 404, message: 'Not Found' } });
});

// ---------- Central Error Handler ----------
app.use(errorHandler);

// ---------- Start Server ----------
const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`[api] listening on http://localhost:${port}`);
});
