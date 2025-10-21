export const functions = {
  async getOrderStatus(orderId) {
    // TODO: replace with real DB/API call
    return { orderId, status: "processing", eta: "2 days" };
  },

  async searchProducts(query, limit = 5) {
    // TODO: hook to /api/products?search=
    return { items: [], query, limit };
  },

  async getCustomerOrders(email) {
    // TODO: hook to /api/orders?email=
    return { email, orders: [] };
  },
};
