# Cost model — assumptions & calculations

## Assumptions
- **Model:** Llama 3.1 8B via OpenRouter
  - Prompt = $0.05 / 1K tokens
  - Completion = $0.20 / 1K tokens
- **Support assistant**
  - Avg tokens in: 300
  - Avg tokens out: 400
  - Requests/day: 1,000
  - Cache hit rate: 30%
- **Search suggestions (Typeahead)**
  - Avg tokens in: 15
  - Avg tokens out: 25
  - Requests/day: 50,000
  - Cache hit rate: 70%

## Calculation
Cost/action = (tokens_in/1000 * prompt_price) + (tokens_out/1000 * completion_price)  
Daily cost = Cost/action * Requests/day * (1 − cache_hit_rate)

---

## Results
- **Support assistant**: Cost/action = $0.095, Daily = $66.50  
- **Search suggestions (Typeahead)**: Cost/action = $0.00575, Daily = $86.25  

---

## Cost levers if over budget
- Improve cache hit rate (especially for typeahead).
- Reduce context size (token length).
- Use smaller/cheaper model for typeahead, keep better one for support.
- Fall back to rule-based logic when confidence is high.