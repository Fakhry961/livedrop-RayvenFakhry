// apps/api/src/assistant/llm-client.js
const raw = process.env.LLM_ENDPOINT || "";
// accept either base URL or full /generate; don't hardcode a domain
const endpoint = raw.endsWith("/generate")
  ? raw
  : raw.replace(/\/+$/, "") + "/generate";

// Strong, case-insensitive cleaner for dialogue markers + echoes
export function sanitize(text = "", prompt = "") {
  if (!text) return "";
  if (prompt && text.startsWith(prompt)) text = text.slice(prompt.length);
  const m = text.match(/([\s\S]*?)(?:\r?\n|\r|^)\s*(?:user|assistant)\s*:\s*[\s\S]*$/i);
  if (m) text = m[1];
  text = text.split(/\n{2,}User\b|\nUser\b|^User\b|Assistant\b|^Assistant\b/i)[0];
  text = text.replace(/^["'\s]+|["'\s]+$/g, "").replace(/```[\s\S]*?$/g, "");
  return text.trim();
}

if (!raw) {
  console.warn("[assistant] Missing LLM_ENDPOINT env var — LLM fallback will fail.");
}

function withTimeout(promise, ms = 20000) {
  let t;
  const timeout = new Promise((_, rej) => (t = setTimeout(() => rej(new Error("LLM timeout")), ms)));
  return Promise.race([promise, timeout]).finally(() => clearTimeout(t));
}

export async function generateText(prompt, maxTokens = 250) {
  if (!raw) throw new Error("LLM_ENDPOINT not set");

  const body = {
    prompt,
    max_tokens: maxTokens,
    temperature: 0.7,
    top_p: 0.95,
    stop: ["\nUser", "\n\nUser", "User:", "\nAssistant", "Assistant:"],
  };

  const attempt = () =>
    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

  // one retry for flaky tunnels
  let res;
  try {
    res = await withTimeout(attempt());
  } catch {
    res = await withTimeout(attempt());
  }

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    console.error(`[LLM] ${res.status} at ${endpoint}\n${txt}`);
    throw new Error(`LLM error ${res.status}`);
  }

  const data = await res.json().catch(() => ({}));
  return sanitize((data && data.text) || "", prompt);
}
