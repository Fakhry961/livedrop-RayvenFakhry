/**
 * Product shape used by the mock catalog and UI.
 *
 * - `id`: unique SKU identifier
 * - `title`: human-friendly product title
 * - `price`: numeric price in store currency
 * - `image`: URL to product image
 * - `tags`: array of category/tag slugs
 * - `stockQty`: current available inventory
 * - `desc`: optional human-readable description
 */
/// <reference types="vite/client" />

export type Product = {
  id: string;
  title: string;
  price: number;
  image: string;
  tags: string[];
  stockQty: number;
  desc?: string;
};

// Build the URL for the local mock catalog. In dev we append a cache-busting
// query param so the file reloads on changes; in production the path is stable.
const catalogUrl =
  `/mock-catalog.json${import.meta.env.DEV ? `?v=${Date.now()}` : ""}`;

/**
 * Fetch the product catalog (mock JSON). Returns an array of Product.
 * In development the request bypasses cache so authors see edits immediately.
 */
export const listProducts = async (): Promise<Product[]> => {
  const res = await fetch(catalogUrl, {
    cache: import.meta.env.DEV ? "no-store" : "default",
  });
  if (!res.ok) throw new Error(`catalog fetch failed: ${res.status}`);
  return res.json();
};

/**
 * Return a single product by id or undefined if not found.
 */
export const getProduct = async (id: string) => {
  const all = await listProducts();
  return all.find(p => p.id === id);
};

const STATUSES = ["Placed","Packed","Shipped","Delivered"] as const;
/**
 * Order tracking/status information returned by the mock order API.
 */
export type OrderInfo = {
  status: (typeof STATUSES)[number];
  carrier?: string | null;
  eta?: string | null;
};

/**
 * Determine an order's status using a few layered heuristics:
 * 1. If a timing key exists in localStorage use it to compute progression.
 * 2. Otherwise read persisted orders in localStorage and compute elapsed-based status.
 * 3. Fallback to a deterministic mapping based on the id string.
 *
 * This is intentionally simple and deterministic for the demo environment.
 */
export const getOrderStatus = async (id: string): Promise<OrderInfo> => {
  try {
    // First check for an explicit timing key possibly written by the checkout UI
    const timingKey = `order:${id}:timing`
    const timingRaw = localStorage.getItem(timingKey)
    if (timingRaw) {
      try {
        const t = JSON.parse(timingRaw) as { startTs: number; intervalMs: number; startStep?: number }
        const elapsed = Date.now() - (t.startTs || 0)
        const interval = Math.max(1, t.intervalMs || 1000)
        const step = (t.startStep || 0) + Math.floor(elapsed / interval)
        // map step 0 -> Placed, 1 -> Packed, 2 -> Shipped, 3+ -> Delivered
        let status: (typeof STATUSES)[number] = 'Placed'
        if (step >= 3) status = 'Delivered'
        else if (step === 2) status = 'Shipped'
        else if (step === 1) status = 'Packed'
        return {
          status,
          carrier: status === 'Placed' ? null : 'AcmeCarrier',
          eta: status === 'Delivered' ? null : '3–5 days',
        }
      } catch (err) {
        // fall through to other checks
      }
    }

    const raw = localStorage.getItem('storefront-orders')
    const map = raw ? JSON.parse(raw) as Record<string, { createdAt: number } & Record<string, any>> : {}
    const entry = map[id]
    if (entry && entry.createdAt) {
      const elapsed = Date.now() - entry.createdAt
      // simple progression by elapsed milliseconds
      // <10s: Placed, <20s: Packed, <40s: Shipped, >=40s: Delivered
      let status: (typeof STATUSES)[number] = 'Placed'
      if (elapsed >= 40000) status = 'Delivered'
      else if (elapsed >= 20000) status = 'Shipped'
      else if (elapsed >= 10000) status = 'Packed'
      return {
        status,
        carrier: status === 'Placed' ? null : 'AcmeCarrier',
        eta: status === 'Delivered' ? null : '3–5 days',
      }
    }
  } catch (err) {
    // fall through to deterministic fallback
    console.warn('order status read failed', err)
  }

  // fallback deterministic behaviour when no persisted order exists
  const idx = Math.min(STATUSES.length - 1, Math.max(0, id.length % STATUSES.length));
  const status = STATUSES[idx];
  return {
    status,
    carrier: status === "Placed" ? null : "AcmeCarrier",
    eta: status === "Delivered" ? null : "3–5 days",
  };
};

/**
 * Mock placing an order: persist minimal order metadata to localStorage and
 * return a generated orderId. The returned id is not sensitive and is
 * deterministic-ish for easier local testing.
 *
 * @param cart - array of items with id and qty
 */
export const placeOrder = async (cart: { id: string; qty: number }[]) => {
  // deterministic-ish id: timestamp + random suffix
  const raw = Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  const orderId = raw.toUpperCase().slice(0, 12)
  try {
    const rawMap = localStorage.getItem('storefront-orders')
    const map = rawMap ? JSON.parse(rawMap) as Record<string, any> : {}
    map[orderId] = { createdAt: Date.now(), cart }
    localStorage.setItem('storefront-orders', JSON.stringify(map))
  } catch (err) {
    console.warn('failed to persist order', err)
  }
  return { orderId }
}
