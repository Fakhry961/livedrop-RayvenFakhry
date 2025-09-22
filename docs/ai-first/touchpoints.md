# AI Touchpoints — Selected

This file documents the two touchpoints I selected: Typeahead and Support assistant.

---

## 1) Typeahead / Search Suggestions

### Problem statement
Users abandon or take too long to find SKUs with free-text search. I want near-instant, relevant suggestions while typing (typeahead) that increase click-through and reduce time-to-purchase without adding high per-request cost.

### Happy path (6–10 steps)
1. User focuses on search box and types the first character(s).
2. Frontend sends a lightweight request to Typeahead endpoint: `{q, session_id}`.
3. CDN/local edge checks a cached result (TTL short) for that query prefix.
4. If cache hit → return suggestions (render on client).
5. If cache miss → edge calls internal Typeahead service:
   - local prefix index / lightweight search for exact matches
   - if still not enough results, call a small re-ranker / completion model to generate suggestions
6. Rerank results by business heuristics (in-stock, top-sellers, margin).
7. Return top-N suggestions; client renders with immediate trackable IDs for click-through.
8. Log query for analytics and cache the response for short TTL.

### Grounding & guardrails
- **Source of truth:** product catalog (10k SKUs) + in-memory prefix index and recent search logs.
- **Retrieval scope:** top 200 candidate SKUs; final top-5 returned.
- **Max context:** only the immediate query and short session context (≤ 256 tokens).
- **Refuse/out-of-scope:** if user asks long-form questions or personal/account tasks, show a “Try search or ask support” hint.

### Human-in-the-loop
- Not required live. I will monitor low-confidence queries (top 1k unknown) in a dashboard and review them weekly.
- SLA: weekly triage by product owner role (me for prototype).

### Latency budget (p95 target: **≤ 300 ms**)
- Client RTT & rendering: **80 ms**
- Cache check: **20 ms**
- Local index lookup: **40 ms**
- Model inference (on miss): **140 ms**
- Re-ranking/formatting: **20 ms**  
**Total = 300 ms**

**Cache strategy:** precompute/push top queries to CDN (TTL 60s); use index+model only for long tail.

### Error & fallback behavior
- If model times out → fallback to prefix-only suggestions.
- If data unavailable → show generic categories (e.g. “Shoes”, “Jackets”).

### PII handling
- Typeahead requests contain no PII. Block email/phone/card patterns client-side.
- Logs: keep 30 days raw, then mask before long-term storage.

### Success metrics
- Product: **Typeahead → Click Rate** = clicks_on_suggestion / typeahead_shown
- Product: **Time-to-first-click reduction** = median delta vs baseline
- Business: **Conversion lift** = conversion_rate_with_typeahead − baseline_conversion_rate

### Feasibility note
I already have search logs and catalog data. A local prefix index + cached top queries will deliver sub-300 ms latency. Next step: build an edge endpoint with cached queries and a re-ranker, then run a small A/B test.

---

## 2) Support Assistant (FAQ + Order-status)

### Problem statement
Many users ask about order status or policies. A grounded assistant can answer the majority of these without agent intervention, reducing cost and improving satisfaction.

### Happy path
1. User opens support widget and asks: “Where is my order #12345?”
2. Frontend sends `{question, order_id, user_token}`.
3. Service validates ownership of the order.
4. Retrieve FAQ/policy snippets + `order-status` API response.
5. Build grounded prompt with redacted info.
6. Call model; get suggested reply.
7. UI shows answer with “Accept / Edit / Escalate” controls.
8. If accepted → resolved. If escalated → ticket is created.

### Grounding & guardrails
- **Source of truth:** FAQ markdown, catalog metadata, `order-status` API.
- **Scope:** top 5 FAQ paragraphs + current order snapshot.
- **Max context:** 4,096 tokens.
- **Refuse outside scope:** legal, payments, account deletion → auto-escalate.

### Human-in-the-loop
- Escalate when confidence <0.60 or keywords like “refund”, “legal”, “cancellation” appear.
- UI gives “Escalate” button.
- SLA: agent review within 4 hours.

### Latency budget (p95 target: **≤ 1200 ms**)
- Client RTT/UI: **150 ms**
- Retrieval: **350 ms**
- Vector search/ranking: **200 ms**
- Model inference: **400 ms**
- Post-process/render: **100 ms**  
**Total = 1200 ms**

**Cache strategy:** cache static FAQs only; always fetch order status fresh.

### Error & fallback behavior
- If model fails → show canned reply and create support ticket with context.

### PII handling
- Send only redacted context (hashed order id, no personal identifiers).
- Client strips names/emails/phones.
- Logs: encrypted 30-day retention.

### Success metrics
- Product: **Self-serve resolution rate** = resolved_by_assistant / requests
- Product: **Escalation rate** = escalations / requests
- Business: **Support contact reduction** = (baseline_contacts − new_contacts) / baseline_contacts

### Feasibility note
The FAQ file and `order-status` API are available. The main task is secure retrieval and redaction. Next step: prototype endpoint that takes `{question, order_id}`, retrieves docs+status, and returns a grounded answer.
