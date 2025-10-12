import qa from './ground-truth.json'
import { getOrderStatus } from '../lib/api'

const ORDER_RE = /[A-Z0-9]{10,}/i

const STOPWORDS = new Set([
  'the','is','in','at','of','a','an','and','or','to','for','how','do','i','my','me','what','where','when','who','can','you','these'
])

/**
 * Lightweight tokenizer used to create bag-of-words features for the
 * ground-truth Q&A matches. Removes short words and a small set of stopwords.
 */
function tokenize(s: string) {
  return s
    .toLowerCase()
    .split(/\W+/)
    .filter(Boolean)
    .filter(t => t.length > 2 && !STOPWORDS.has(t))
}

/**
 * Answer a free-form question using a small local Q&A dataset (`ground-truth.json`).
 *
 * Behavior:
 * - If an order ID is present in the query, try to resolve the order status and
 *   prefer order-related Q&As.
 * - If the user asks about an order without providing an ID, prompt for the ID.
 * - Otherwise match tokens against the dataset and return the best-scoring answer
 *   when confidence is sufficient; otherwise return a refusal.
 *
 * Returns an object of shape `{ kind: 'answer'|'refusal', text: string, cite: string|null }`.
 */
export async function answer(raw: string) {
  const q = raw.trim()
  const id = (q.match(ORDER_RE)?.[0] || '').toUpperCase()
  const order = id ? await getOrderStatus(id) : null

  // tokens excluding stopwords
  const toks = new Set(tokenize(q))

  const low = q.toLowerCase()
  // If user asks about order location/track/status but didn't include an id, prompt for it
  if (!id && /order/.test(low) && (/where/.test(low) || /track/.test(low) || /status/.test(low))) {
    return { kind: 'answer', text: 'Please provide your order ID so I can check its status. For privacy, you may paste just the full ID or the last 4 characters.', cite: null }
  }

  // If there's an order id, prefer Order-related Q&As
  let candidates = qa
  if (id) {
    const lowers = qa.filter(it => it.category.toLowerCase() === 'order' || /order/i.test(it.question))
    if (lowers.length > 0) candidates = lowers
  }

  let best = { score: 0, item: null as any }
  for (const item of candidates) {
    const ktoks = new Set(tokenize(item.question + ' ' + item.category))
    const score = [...toks].filter(t => ktoks.has(t)).length
    if (score > best.score) best = { score, item }
  }

  // Confidence thresholds: allow lower threshold when an order id is present
  const confident = id ? best.score >= 1 : best.score >= 2

  if (!confident)
    return { kind: 'refusal', text: "I'm sorry — I don't know the answer to that. Please contact support.", cite: null }

  const cite = `[${best.item.qid}]`
  const text = order
    ? `${best.item.answer}\n\nOrder ${id.slice(-4).padStart(id.length, '•')} status: ${order.status}`
    : best.item.answer
  return { kind: 'answer', text, cite }
}
