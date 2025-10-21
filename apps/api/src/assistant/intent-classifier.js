export function classifyIntent(text) {
  const t = String(text || "").toLowerCase();
  if (t.includes("order")) return "order_status";
  if (t.includes("refund")) return "refund_request";
  if (t.includes("product") || t.includes("recommend")) return "product_search";
  if (["hi", "hello", "hey"].some(w => t.includes(w))) return "chitchat";
  return "unknown";
}
