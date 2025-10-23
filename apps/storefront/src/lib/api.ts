/* ============================================================
 * Storefront – API client (frontend)
 * File: src/lib/api.ts
 * ------------------------------------------------------------
 * Exposes a typed, resilient client for your Express API.
 * - Works with VITE_API_URL (production) or same-origin (dev)
 * - Falls back to /mock-catalog.json for products if API is down
 * - Provides helpers for Products, Orders, Customers, Assistant,
 *   Dashboard, and Analytics.
 * ============================================================
 */

/* =========================
 * Environment & Constants
 * ========================= */

export const API: string =
  (import.meta as any)?.env?.VITE_API_URL?.replace(/\/+$/, "") || "";

/** Paths (change here if your backend routes differ) */
const PATH = {
  products: "/api/products",
  orders: "/api/orders",
  customers: "/api/customers",
  generate: "/api/generate",
  dashboard: "/api/dashboard",
  analytics: "/api/analytics",
};

/** Public mock catalog (fallback when API is unreachable) */
const MOCK_CATALOG_URL = `/mock-catalog.json${
  (import.meta as any).env?.DEV ? `?v=${Date.now()}` : ""
}`;

/* =========================
 * Types
 * ========================= */

/** Product shape aligned with DB + mock-catalog.json */
export type Product = {
  id: string; // SKU
  title: string;
  price: number;
  image: string;
  tags: string[];
  stockQty: number;
  desc?: string;
};

/** Paginated API envelope for products */
export type ProductListResponse = {
  items: Product[];
  total: number;
  page: number;
  limit: number;
};

/** Cart item (frontend state) */
export type CartItem = { id: string; qty: number };

/** Order document (Mongo-backed) */
export type OrderDocument = {
  _id: string;
  customerId?: string | null;
  status:
    | "PENDING"
    | "PROCESSING"
    | "SHIPPED"
    | "DELIVERED"
    | "CANCELLED"
    | "COMPLETED";
  items: Array<{ sku: string; title: string; price: number; qty: number }>;
  amounts: {
    subtotal: number;
    shipping: number;
    tax: number;
    total: number;
    currency: string;
  };
  createdAt: string;
  updatedAt: string;
  history?: Array<{ status: OrderDocument["status"]; at: string }>;
};

/** Minimal status response (stream/poll) */
export type OrderStatus = {
  status: OrderDocument["status"];
  eta?: string | null;
};

/** Create-order response */
export type CreateOrderResponse = {
  orderId: string;
  status: OrderDocument["status"];
  total: number;
  createdAt: string;
};

/** Customer record (lightweight) */
export type Customer = {
  _id?: string;
  email: string;
  name?: string;
  createdAt?: string;
  updatedAt?: string;
};

/** Assistant /generate output */
export type GenerateResponse = {
  output: string;
  model?: string;
  latency_ms?: number;
  [k: string]: unknown;
};

/** Dashboard data model stubs (extend as your backend returns) */
export type DashboardKPIs = {
  revenue24h: number;
  orders24h: number;
  aov24h: number;
  topSKUs: Array<{ sku: string; title: string; qty: number }>;
};

export type DailyRevenuePoint = {
  date: string; // YYYY-MM-DD
  revenue: number;
  orders: number;
  aov: number;
};

/* =========================
 * Low-level helpers
 * ========================= */

type SafeFetchOptions = RequestInit & {
  /** When true, returns `null` on 404 (instead of throwing) */
  allow404?: boolean;
  /** Timeout in ms (default 30s) */
  timeoutMs?: number;
};

/** Promise.race timeout wrapper */
function withTimeout<T>(p: Promise<T>, ms = 30000): Promise<T> {
  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), ms);
  return Promise.race([
    p,
    new Promise<T>((_, rej) => {
      setTimeout(() => rej(new Error("Request timeout")), ms);
    }),
  ]).finally(() => clearTimeout(timeout));
}

/** Centralized fetch w/ rich error messages, 404 option, and timeout */
async function safeFetch<T = any>(
  url: string,
  opts: SafeFetchOptions = {}
): Promise<T> {
  const { allow404 = false, timeoutMs = 30000, ...init } = opts;

  const res = await withTimeout(
    fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...(init.headers || {}),
      },
      ...init,
    }),
    timeoutMs
  );

  if (allow404 && res.status === 404) return null as unknown as T;

  if (!res.ok) {
    // Try to surface JSON errors first
    let bodyText = "";
    try {
      bodyText = await res.text();
    } catch {}
    try {
      const parsed = bodyText ? JSON.parse(bodyText) : null;
      if (parsed?.error) {
        const msg =
          typeof parsed.error === "string"
            ? parsed.error
            : parsed.error.message || parsed.error.code || String(parsed.error);
        throw new Error(msg || `Request failed: ${res.status}`);
      }
    } catch {
      // Body wasn’t JSON or parsing failed — fall back
    }
    throw new Error(bodyText || `Request failed: ${res.status}`);
  }

  // Some endpoints may return 204 No Content
  if (res.status === 204) return undefined as unknown as T;

  return (await res.json()) as T;
}

/** Build absolute API URL (gracefully handles empty API => same-origin) */
function apiUrl(path: string, query?: Record<string, any>) {
  const base = API || "";
  const p = `${base}${path}`;
  if (!query) return p;
  const qs = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    qs.set(k, String(v));
  });
  const s = qs.toString();
  return s ? `${p}?${s}` : p;
}

/* =========================
 * Utility helpers for UI
 * ========================= */

export function fmtCurrency(v: number, currency = "USD") {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(v / (currency === "JPY" ? 1 : 1)); // keep dollars as-is
}

/** Small delay helper (for retries/UX) */
export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* =========================
 * Products
 * ========================= */

/**
 * listProducts – get a page from the backend, else fallback to mock file.
 * Recommended default: page=1, limit=1000 (to mirror your mock).
 */
export async function listProducts(params?: {
  page?: number;
  limit?: number;
  search?: string;
  tag?: string;
}): Promise<Product[]> {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 1000;

  // Prefer API if configured & reachable
  if (API) {
    try {
      const res = await safeFetch<ProductListResponse>(
        apiUrl(PATH.products, {
          page,
          limit,
          q: params?.search,
          tag: params?.tag,
        })
      );
      if (Array.isArray(res?.items) && res.items.length) {
        // Map backend product docs to frontend shape
        return res.items.map(mapBackendToFrontend);
      }
    } catch {
      // fall back to mock
    }
  }

  // Mock fallback (public file)
  const r = await fetch(MOCK_CATALOG_URL, {
    cache: (import.meta as any).env?.DEV ? "no-store" : "default",
  });
  if (!r.ok) throw new Error(`catalog fetch failed: ${r.status}`);
  const items = (await r.json()) as Product[];
  // Ensure mock items already match frontend shape
  // Apply client-side filtering if needed
  let filtered = items;
  if (params?.search) {
    const q = params.search.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
    );
  }
  if (params?.tag) {
    filtered = filtered.filter((p) => p.tags.includes(params.tag!));
  }
  // Client-side pagination for mock
  const start = (page - 1) * limit;
  return filtered.slice(start, start + limit);
}

/** getProduct – resolve a single product by SKU */
export async function getProduct(id: string): Promise<Product | undefined> {
  const all = await listProducts();
  return all.find((p) => p.id === id);
}

/**
 * mapBackendToFrontend - convert backend product doc to frontend Product shape
 * Backend shape may include: _id, id, sku, name, price, stock, description, tags, image
 */
function mapBackendToFrontend(b: any): Product {
  return {
    id: b.id || b.sku || (b._id ? String(b._id) : ''),
    title: b.title || b.name || '',
    price: typeof b.price === 'number' ? b.price : Number(b.price || 0),
    image: b.image || b.img || '',
    tags: Array.isArray(b.tags) ? b.tags : [],
    stockQty: typeof b.stock === 'number' ? b.stock : Number(b.stockQty || b.stock || 0),
    desc: b.desc || b.description || '',
  };
}

/** deriveTags – convenience to collect unique tags for filters */
export async function deriveTags(): Promise<string[]> {
  const all = await listProducts();
  return Array.from(new Set(all.flatMap((p) => p.tags))).sort();
}

/* =========================
 * Orders
 * ========================= */

/**
 * placeOrder – send only {id, qty} to API; server resolves price/title/sku.
 * Your server’s /api/orders validates SKUs and returns a new orderId.
 */
export async function placeOrder(
  items: CartItem[]
): Promise<CreateOrderResponse> {
  if (!items?.length) throw new Error("Cart is empty");

  return await safeFetch<CreateOrderResponse>(apiUrl(PATH.orders), {
    method: "POST",
    body: JSON.stringify({ items }),
  });
}

/** getOrder – full order document by id */
export async function getOrder(orderId: string): Promise<OrderDocument> {
  return await safeFetch<OrderDocument>(apiUrl(`${PATH.orders}/${orderId}`));
}

/** getOrderStatus – light status endpoint if exposed; else map from getOrder */
export async function getOrderStatus(
  orderId: string
): Promise<OrderStatus> {
  // Try dedicated /status route first
  try {
    const st = await safeFetch<OrderStatus>(
      apiUrl(`${PATH.orders}/${orderId}/status`)
    );
    if (st) return st;
  } catch {
    // fall back to getOrder
  }
  const doc = await getOrder(orderId);
  return { status: doc.status, eta: null };
}

/** pollOrderStatus – utility polling wrapper (use SSE for realtime) */
export async function pollOrderStatus(
  orderId: string,
  opts: { intervalMs?: number; until?: OrderDocument["status"][] } = {}
): Promise<OrderStatus> {
  const interval = Math.max(1000, opts.intervalMs ?? 3000);
  const until = new Set(opts.until ?? ["DELIVERED", "CANCELLED", "COMPLETED"]);
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const st = await getOrderStatus(orderId);
    if (until.has(st.status)) return st;
    await sleep(interval);
  }
}

/** listCustomerOrders – simple filter by email or id via backend */
export async function listCustomerOrders(params: {
  email?: string;
  customerId?: string;
  page?: number;
  limit?: number;
}): Promise<{ items: OrderDocument[]; total: number; page: number; limit: number }> {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const qs: Record<string, any> = { page, limit };
  if (params.email) qs.email = params.email;
  if (params.customerId) qs.customerId = params.customerId;

  return await safeFetch(apiUrl(PATH.orders, qs));
}

/* =========================
 * Customers
 * ========================= */

/** lookupCustomer – check if a customer exists (by email) */
export async function lookupCustomer(email: string): Promise<Customer | null> {
  if (!email) throw new Error("Email is required");
  return await safeFetch<Customer | null>(
    apiUrl(PATH.customers, { email }),
    { allow404: true }
  );
}

/** upsertCustomer – create or update a customer */
export async function upsertCustomer(
  customer: Customer
): Promise<Customer> {
  if (!customer?.email) throw new Error("Customer email is required");
  return await safeFetch<Customer>(apiUrl(PATH.customers), {
    method: "POST",
    body: JSON.stringify(customer),
  });
}

/* =========================
 * Assistant
 * ========================= */

/**
 * askLLM – posts to /api/generate. Sends optional context to help grounding.
 * Your server can pull products/cart on its own if you prefer.
 */
export async function askLLM(
  prompt: string,
  opts?: { system?: string; cart?: unknown; products?: unknown }
): Promise<GenerateResponse> {
  if (!prompt) throw new Error("Prompt is required");
  return await safeFetch<GenerateResponse>(apiUrl(PATH.generate), {
    method: "POST",
    body: JSON.stringify({
      prompt,
      context: {
        system: opts?.system ?? "You are Storefront’s helpful assistant.",
        cart: opts?.cart ?? null,
        products: opts?.products ?? null,
      },
    }),
  });
}

/* =========================
 * Dashboard & Analytics
 * ========================= */

/** getKPIs – summary numbers for Admin dashboard */
export async function getKPIs(): Promise<DashboardKPIs> {
  return await safeFetch<DashboardKPIs>(apiUrl(`${PATH.dashboard}/kpis`));
}

/** getRecentOrders – table for Admin dashboard */
export async function getRecentOrders(params?: {
  page?: number;
  limit?: number;
}): Promise<{ items: OrderDocument[]; total: number; page: number; limit: number }> {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;
  return await safeFetch(
    apiUrl(`${PATH.dashboard}/recent-orders`, { page, limit })
  );
}

/** getLowStock – list of products low on inventory */
export async function getLowStock(params?: {
  threshold?: number;
  limit?: number;
}): Promise<{ items: Product[] }> {
  const threshold = params?.threshold ?? 5;
  const limit = params?.limit ?? 20;
  return await safeFetch(apiUrl(`${PATH.dashboard}/low-stock`, { threshold, limit }));
}

/** getDailyRevenue – for Recharts/Chart.js line/area chart */
export async function getDailyRevenue(params?: {
  days?: number; // default 30
}): Promise<DailyRevenuePoint[]> {
  const days = params?.days ?? 30;
  return await safeFetch<DailyRevenuePoint[]>(
    apiUrl(`${PATH.analytics}/daily-revenue`, { days })
  );
}

/* =========================
 * Health / Misc
 * ========================= */

/** pingAPI – quick up/down check for the Admin panel footer */
export async function pingAPI(): Promise<boolean> {
  try {
    const res = await fetch(apiUrl("/"));
    return res.ok;
  } catch {
    return false;
  }
}

/** version – optionally ask the backend for its version */
export async function getAPIVersion(): Promise<{ version: string } | null> {
  try {
    return await safeFetch<{ version: string }>(apiUrl(`/version`), {
      allow404: true,
      timeoutMs: 5000,
    });
  } catch {
    return null;
  }
}

/* =========================
 * Example convenience hooks
 * (Optional: use if you like)
 * ========================= */

export async function searchProducts(q: string): Promise<Product[]> {
  if (!q || !q.trim()) return listProducts({ limit: 1000 });
  return listProducts({ search: q, limit: 1000 });
}

/** Build a checkout payload directly from a cart map */
export function toOrderItemsFromCart(
  cart: Array<{ id: string; qty: number }>
): CartItem[] {
  return cart.map(({ id, qty }) => ({ id, qty }));
}
