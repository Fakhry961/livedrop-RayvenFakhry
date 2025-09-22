# AI Capability Map (ShopLite) — Week 2

**Assumption for cost rows:** Llama 3.1 8B via OpenRouter — $0.05 / 1K prompt tokens, $0.20 / 1K completion tokens.

| Capability | Intent (user) | Inputs (this sprint) | Risk 1–5 (tag) | p95 ms | Est. cost/action | Fallback | Selected |
|---|---|---|---:|---:|---:|---|:---:|
| Typeahead / Search suggestions | Find product quickly while typing | query text, session context, top SKUs (catalog) | 2 | 300 | $0.00575 | Local prefix index / cached top queries | Yes |
| Support assistant (FAQ + order-status) | Ask about order or policy, get quick answer | question text, order id (optional), policies/FAQ markdown, order-status API | 3 (PII) | 1200 | $0.095 | Canned reply + escalate to human | Yes |
| Product recommendations (session-level) | Get relevant upsell / cross-sell | browsing context, SKU embedding, purchase history (future) | 4 | 800 | ~$0.16 | Rule-based "similar items" engine | No |
| SKU auto-tagging / metadata enrichment (batch) | Auto-classify attributes from SKU text | product title, description, short spec | 2 | 1000 (batch) | ~$0.02 (batch) | Manual tag entry UI | No |

**Why these two**  
I selected **Typeahead** and **Support assistant** because they address two different but critical KPIs with relatively low integration risk. Typeahead reduces friction in search and improves conversion and time-to-click with a low per-action cost and strong caching potential. The Support assistant decreases live support load and improves satisfaction by using grounded answers (FAQ markdown and `order-status` API are already available). Both are incremental, measurable, and quick to prototype.
