import { classifyIntent } from "./intent-classifier.js";
import { functions } from "./function-registry.js";
import { generateText } from "./llm-client.js";

// helper to clean up model output (cuts extra dialogue markers, trailing spaces)
function sanitizeLLMOutput(text = "", query = "") {
  if (!text) return "";

  // remove echoed prompt if present
  if (query && text.startsWith(query)) {
    text = text.slice(query.length);
  }

  // stop at "User" or "Assistant" if the model continues
  const cutoff = text.match(/([\s\S]*?)(?:\n|\r|^)\s*(User|Assistant)\s*:?/i);
  if (cutoff) text = cutoff[1];

  // trim stray punctuation or whitespace
  return text.replace(/^["'\s]+|["'\s]+$/g, "").trim();
}

export async function answer(query) {
  const intent = classifyIntent(query);

  // 🔹 Tool-first path
  if (intent === "order_status") {
    const idMatch = String(query).match(/(order[_ -]?\w+)/i);
    const orderId = idMatch ? idMatch[0] : "unknown";
    const info = await functions.getOrderStatus(orderId);

    return {
      text: `Order **${info.orderId}** is **${info.status}**. ETA: ${info.eta}.`,
      meta: { intent, used: "getOrderStatus" },
    };
  }

  // 🔹 LLM fallback path
  const systemPrompt =
    "You are a helpful assistant for an e-commerce store. Be concise. If you lack data, say so.";
  const prompt = `${systemPrompt}\n\nUser: ${query}\nAssistant:`;

  try {
    const rawText = await generateText(prompt, 300);
    const cleaned = sanitizeLLMOutput(rawText, query);

    return { text: cleaned, meta: { intent, used: "LLM" } };
  } catch (err) {
    return {
      text: "Sorry — I had trouble contacting the model.",
      meta: { intent, used: "LLM", error: String(err?.message || err) },
    };
  }
}
