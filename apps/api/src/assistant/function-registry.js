// Minimal registry with schema exposure and controlled execution
const _registry = new Map();

/** Register a function with a JSON-like schema */
export function register({ name, description, parameters, handler }) {
  if (!name || typeof handler !== "function") throw new Error("Invalid function spec");
  _registry.set(name, { name, description, parameters, handler });
}

/** Return all function schemas (for prompt/tooling) */
export function getAllSchemas() {
  return Array.from(_registry.values()).map(({ handler, ...schema }) => schema);
}

/** Execute a registered function by name with args */
export async function execute(name, args = {}) {
  const entry = _registry.get(name);
  if (!entry) throw new Error(`Unknown function: ${name}`);
  return await entry.handler(args);
}

// ---- Built-ins: pre-register the three functions ----
register({
  name: "getOrderStatus",
  description: "Get order status and ETA by orderId",
  parameters: {
    type: "object",
    properties: { orderId: { type: "string" } },
    required: ["orderId"]
  },
  handler: async ({ orderId }) => {
    // TODO: replace with real DB/API call
    return { orderId, status: "processing", eta: "2 days" };
  }
});

register({
  name: "searchProducts",
  description: "Search products by query with optional limit",
  parameters: {
    type: "object",
    properties: {
      query: { type: "string" },
      limit: { type: "number", default: 5 }
    },
    required: ["query"]
  },
  handler: async ({ query, limit = 5 }) => {
    // TODO: hook to /api/products?search=
    return { items: [], query, limit };
  }
});

register({
  name: "getCustomerOrders",
  description: "List orders for a customer by email",
  parameters: {
    type: "object",
    properties: { email: { type: "string", format: "email" } },
    required: ["email"]
  },
  handler: async ({ email }) => {
    // TODO: hook to /api/orders?email=
    return { email, orders: [] };
  }
});
