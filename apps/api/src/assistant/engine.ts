import { classifyIntent } from "./intent-classifier.js";
import { functions } from "./function-registry.js";

export async function answer(query: string) {
  const intent = classifyIntent(query);
  if (intent === "order_status") {
    const idMatch = query.match(/(order[-_ ]?\d+)/i);
    const orderId = idMatch ? idMatch[0] : "order-unknown";
    return functions.getOrderStatus(orderId);
  }
  return { text: "Sorry, I don't know." };
}
