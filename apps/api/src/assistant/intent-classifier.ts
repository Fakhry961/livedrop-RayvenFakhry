export function classifyIntent(text: string) {
  // very small mock classifier
  text = text.toLowerCase();
  if (text.includes("order")) return "order_status";
  if (text.includes("refund")) return "refund_request";
  return "unknown";
}
