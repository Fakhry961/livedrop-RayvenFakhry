import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDb } from './db';
import customers from './routes/customers';
import products from './routes/products';
import orders from './routes/orders';
import analytics from './routes/analytics';
import dashboard from './routes/dashboard';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/customers', customers);
app.use('/api/products', products);
app.use('/api/orders', orders);
app.use('/api/analytics', analytics);
app.use('/api/dashboard', dashboard);

const port = process.env.PORT ?? 4000;
connectDb().then(() => {
  app.listen(port, () => console.log(`API listening on http://localhost:${port}`));
});
