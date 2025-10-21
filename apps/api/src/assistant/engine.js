// apps/api/src/assistant/engine.js
// Routes by intent, does simple grounding, caps function calls (≤2),
// validates [PolicyID] citations, composes a prompt, and calls /generate.

import { classifyIntent } from "./intent-classifier.js";
import { getAllSchemas, execute } from "./function-registry.js";
import { generateText } from "./llm-client.js";
import { readFile } from "node:fs/promises";
import YAML from "yaml";

/* =========================
   Load prompts & knowledge
   ========================= */
let PROMPT_CFG, POLICIES;

async function loadArtifacts() {
  if (!PROMPT_CFG) {
    const yamlText = await readFile(new URL("../../docs/prompts.yaml", import.meta.url), "utf8");
    PROMPT_CFG = YAML.parse(yamlText);
  }
  if (!POLICIES) {
    const jsonText = await readFile(new URL("../../docs/ground-truth.json", import.meta.url), "utf8");
    POLICIES = JSON.parse(jsonText);
  }
}

/* =========================
   Helpers
   ========================= */

// find policies by a loose category keyword
function findPoliciesByCategory(category) {
  const c = String(category || "").toLowerCase();
  return POLICIES.filter(p => String(p.category || "").toLowerCase().includes(c));
}

// strip any [PolicyID] that does not exist in KB
function validatePolicyTags(text) {
  const ids = [...text.matchAll(/\[(Policy[\d.]+)\]/g)].map(m => m[1]);
  if (!ids.length) return text;
  const valid = new Set(POLICIES.map(p => p.id));
  return ids.reduce((acc, id) => (valid.has(id) ? acc : acc.replaceAll(`[${id}]`, "")), text);
}

// last-pass safety to remove chat markers or echoed prompt
function sanitizeLLMOutput(text = "", query = "") {
  if (!text) return "";
  if (query && text.startsWith(query)) text = text.slice(query.length);
  const cutoff = text.match(/([\s\S]*?)(?:\n|\r|^)\s*(User|Assistant)\s*:?/i);
  if (cutoff) text = cutoff[1];
  return text.replace(/^["'\s]+|["'\s]+$/g, "").trim();
}

/* =========================
   Main entry
   ========================= */

export async function answer(query) {
  await loadArtifacts();

  const intent = classifyIntent(query);
  let fnCalls = 0;
  const MAX_FN = 2;

  // ---------- Tool-first: order status ----------
  if (intent === "order_status") {
    // tolerate "order 12345", "order-12345", etc.
    const idMatch = String(query).match(/(order[_ -]?\w+)/i);
    const orderId = idMatch ? idMatch[0] : "unknown";
    const info = await execute("getOrderStatus", { orderId }); fnCalls++;
    return {
      text: `Order **${info.orderId}** is **${info.status}**. ETA: ${info.eta}.`,
      meta: { intent, used: "getOrderStatus", fnCalls }
    };
  }

  // ---------- Optional second tool call examples (kept off by default) ----------
  // if (intent === "product_search" && fnCalls < MAX_FN) {
  //   const res = await execute("searchProducts", { query, limit: 5 }); fnCalls++;
  //   // You could summarize res.items here, or let the LLM do it via grounding below.
  // }

  // ---------- Grounding for policy questions ----------
  let groundSnippets = "";
  if (intent === "policy_question") {
    // naive extraction of a category keyword from the query
    const cat = /refund|return|warranty|privacy|shipping|payments|pricing|support/i.exec(query || "")?.[0] || "policy";
    const hits = findPoliciesByCategory(cat.toLowerCase()).slice(0, 3); // keep short/contextual
    if (hits.length) {
      groundSnippets =
        "Relevant Policies:\n" +
        hits.map(p => `- [${p.id}] (${p.lastUpdated}) ${p.summary}`).join("\n");
    }
  }

  // ---------- Compose system + task prompt ----------
  const toneLines = (PROMPT_CFG?.tone || []).map(t => `- ${t}`).join("\n");
  const neverSay = (PROMPT_CFG?.never_say || []).map(t => `- ${t}`).join("\n");
  const toolSchemas = JSON.stringify(getAllSchemas()); // for future function-use prompting (not shown to user)

  const systemPrompt =
    `Role: ${PROMPT_CFG?.role || "Support assistant"}\n` +
    `Tone:\n${toneLines}\n` +
    `Never say:\n${neverSay}\n` +
    (groundSnippets ? `\n${groundSnippets}\n` : "") +
    `\nAvailable functions (do NOT mention these to the user): ${toolSchemas}`;

  // Keep assistant turn explicit; client-side sanitize trims "User/Assistant" spill
  const prompt =
    `${systemPrompt}\n\n` +
    `User: ${query}\n` +
    `If a policy is quoted, include its [PolicyID] from the list above. Keep the answer to 1–3 sentences.\n` +
    `Assistant:`;

  // ---------- Call LLM ----------
  try {
    const rawText = await generateText(prompt, 300);
    const validated = validatePolicyTags(rawText);
    const cleaned = sanitizeLLMOutput(validated, query);
    return { text: cleaned, meta: { intent, used: "LLM", fnCalls } };
  } catch (err) {
    return {
      text: "Sorry — I had trouble contacting the model.",
      meta: { intent, used: "LLM", error: String(err?.message || err), fnCalls }
    };
  }
}
