export const functions = {
  getOrderStatus: (orderId: string) => ({ orderId, status: "processing", eta: "2 days" }),
};
