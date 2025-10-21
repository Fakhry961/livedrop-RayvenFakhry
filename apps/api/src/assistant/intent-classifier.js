export function classifyIntent(text) {
  const t = String(text || "").toLowerCase();

  // high-signal checks first
  if (/\b(policy|refund policy|return policy|warranty|terms|privacy)\b/.test(t)) return "policy_question";
  if (/\b(order|tracking|shipment|delivery|where is my order|order #?\w+)\b/.test(t)) return "order_status";
  if (/\b(product|recommend|suggest|gift|under \$?\d+)/.test(t)) return "product_search";
  if (/\b(refund|return|broken|damaged|not working|complain|complaint)\b/.test(t)) return "complaint";

  // safety/off-topic cues
  if (/\b(hack|bypass|exploit|illegal|hate|violence|self-harm)\b/.test(t)) return "violation";
  if (/\bhi\b|\bhello\b|\bhey\b/.test(t)) return "chitchat";
  if (/\bweather|news|politic|movie|unrelated\b/.test(t)) return "off_topic";

  return "unknown";
}
