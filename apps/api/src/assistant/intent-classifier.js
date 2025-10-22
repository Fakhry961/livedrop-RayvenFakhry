export function classifyIntent(text) {
  const t = String(text || "").toLowerCase();

  // order status: catch "order 12345", "order#12345", "order-12345", "track order", etc.
  if (/\border(?:\s*[:#-]?\s*\w+)?\b/.test(t) || /\btrack(?:ing)?\b.*\border\b/.test(t)) return "order_status";

  if (/\b(policy|refund policy|return policy|warranty|terms|privacy)\b/.test(t)) return "policy_question";
  if (/\b(product|recommend|suggest|gift|under \$?\d+)/.test(t)) return "product_search";
  if (/\b(refund|return|broken|damaged|not working|complain|complaint)\b/.test(t)) return "complaint";
  if (/\b(hack|bypass|exploit|illegal|hate|violence|self-harm)\b/.test(t)) return "violation";
  if (/\bhi\b|\bhello\b|\bhey\b/.test(t)) return "chitchat";
  if (/\bweather|news|movie|politic|unrelated\b/.test(t)) return "off_topic";

  return "unknown";
}
