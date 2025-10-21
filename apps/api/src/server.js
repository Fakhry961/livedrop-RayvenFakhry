import express from 'express';
import cors from 'cors';
import { connectDb } from './db.js';
import { errorHandler } from './middleware/errorHandler.js';
import { metricsMiddleware } from './middleware/metrics.js';

import customers from './routes/customers.js';
import products from './routes/products.js';
import orders from './routes/orders.js';
import analytics from './routes/analytics.js';
import dashboard from './routes/dashboard.js';

const app = express();

const origins = (process.env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({ origin: origins.length ? origins : undefined }));

app.use(express.json());
app.use(metricsMiddleware);

const db = await connectDb();
app.use((req, _res, next) => { req.db = db; next(); });

// Health
app.get('/', (_req, res) => {
  res.type('text/plain').send('OK');
});

// Routes
app.use('/api', customers);
app.use('/api', products);
app.use('/api', orders);
app.use('/api', analytics);
app.use('/api', dashboard);

// 404
app.use((_req, res) => res.status(404).json({ error: { code: 404, message: 'Not Found' } }));

// Central error handler
app.use(errorHandler);

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`[api] listening on http://localhost:${port}`));
