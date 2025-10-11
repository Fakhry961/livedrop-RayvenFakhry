import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useCart } from '../lib/store'

export default function Cart() {
  const items = useCart(s => s.items)
  const inc = useCart(s => s.inc)
  const dec = useCart(s => s.dec)
  const remove = useCart(s => s.remove)

  const total = items.reduce((sum, it) => sum + it.price * it.qty, 0)

  const nav = useNavigate()
  const [focusedItem, setFocusedItem] = useState<string | null>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!/^\/cart$/.test(window.location.pathname)) return
      const active = document.activeElement as HTMLElement | null
      const tag = active?.tagName?.toLowerCase()
      if (tag === 'input' || tag === 'textarea' || (active && active.getAttribute('role') === 'spinbutton')) return
      if (e.key === 'Enter') {
        e.preventDefault()
        // If cart is empty, go to catalog instead of checkout
        if (items.length === 0) nav('/')
        else nav('/checkout')
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        nav('/')
      }
      // + / - to increment/decrement focused cart item
      if (e.key === '+' || e.key === '=') {
        const el = document.activeElement as HTMLElement | null
        const item = el?.closest('[data-item-id]') as HTMLElement | null
        const id = item?.getAttribute('data-item-id')
        if (id) {
          e.preventDefault()
          inc(id)
        }
      }
      if (e.key === '-' || e.key === '_') {
        const el = document.activeElement as HTMLElement | null
        const item = el?.closest('[data-item-id]') as HTMLElement | null
        const id = item?.getAttribute('data-item-id')
        if (id) {
          e.preventDefault()
          dec(id)
        }
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [nav, items.length, inc, dec])

  if (items.length === 0)
    return (
      <div>
        <p>Your cart is empty.</p>
        <Link to="/" className="text-blue-600 underline">Go to catalog</Link>
      </div>
    )

  return (
    <div className="space-y-4">
      {items.map(it => {
        const atCap = it.qty >= it.stockQty // 🧠 new: cap check
        const remaining = it.stockQty - it.qty

        return (
          <div
            key={it.id}
            data-item-id={it.id}
            tabIndex={0}
            onFocus={() => setFocusedItem(it.id)}
            onBlur={() => setFocusedItem(prev => (prev === it.id ? null : prev))}
            className="flex items-center justify-between border rounded-lg p-3"
          >
            <div className="flex items-center gap-3">
              <img
                src={it.image}
                alt={it.title}
                className="w-12 h-12 object-cover rounded-md"
                loading="lazy"
              />
              <div>
                <div className="font-medium">{it.title}</div>
                <div className="text-sm text-gray-500">${it.price.toFixed(2)}</div>
                <div className="text-xs text-gray-400">
                  {remaining > 0
                    ? `${remaining} left in stock`
                    : 'Out of stock'}
                </div>
              </div>
            </div>

            {/* Quantity controls */}
            <div className="flex items-center gap-2">
              <button
                aria-label="Decrease quantity"
                className="px-2 py-1 border rounded"
                onClick={() => dec(it.id)}
              >
                <svg
                  className="w-4 h-4 text-gray-700"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M6 12h12"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              <div className="w-8 text-center">{it.qty}</div>

              <button
                aria-label="Increase quantity"
                className={`px-2 py-1 border rounded ${
                  atCap ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={() => !atCap && inc(it.id)}
                disabled={atCap}
                title={atCap ? 'Reached max stock' : 'Increase quantity'}
              >
                <svg
                  className="w-4 h-4 text-gray-700"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 5v14M5 12h14"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            {/* Line total */}
            <div className="w-24 text-right font-medium">
              ${(it.price * it.qty).toFixed(2)}
            </div>

            {/* Remove button */}
            <button
              onClick={() => remove(it.id)}
              aria-label={`Remove ${it.title}`}
              title={`Remove ${it.title}`}
              className="text-sm text-red-600 flex items-center gap-2 px-2 py-1 rounded hover:bg-red-50"
            >
              <svg
                className="w-4 h-4 text-red-600"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M3 6h18"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M10 11v6M14 11v6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 6l1-2h4l1 2"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Remove</span>
            </button>
          </div>
        )
      })}

      {/* Total */}
      <div className="flex items-center justify-between border-t pt-4">
        <div className="text-lg font-semibold">Total</div>
        <div className="text-lg font-semibold">${total.toFixed(2)}</div>
      </div>

      {focusedItem && (
        <div className="text-sm text-gray-500">Tip: press <span className="font-mono">+</span> or <span className="font-mono">-</span> to change quantity for the focused item</div>
      )}

      <Link
        to="/checkout"
        className="inline-block rounded-lg border px-4 py-2 hover:bg-gray-50"
      >
        Proceed to checkout
      </Link>
    </div>
  )
}
