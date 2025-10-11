import { useNavigate, Link } from 'react-router-dom'
import { useCart } from '../lib/store'
import { placeOrder } from '../lib/api'
import { fmtCurrency } from '../lib/format'
import { useEffect, useState } from 'react'

export default function Checkout() {
  const nav = useNavigate()
  const items = useCart(s => s.items)
  const clear = useCart(s => s.clear)
  const total = items.reduce((sum, it) => sum + it.price * it.qty, 0)

  const placeOrderClick = async () => {
    setSubmitting(true)
    const payload = items.map(i => ({ id: i.id, qty: i.qty }))
    const res = await placeOrder(payload)

    // Seed order timing so status progresses across refreshes
    const intervalMs = 2000 + Math.floor(Math.random() * 2000) // 2–4s
    const key = `order:${res.orderId}:timing`
    try {
      localStorage.setItem(
        key,
        JSON.stringify({ startTs: Date.now(), intervalMs, startStep: 0 })
      )
    } catch {}

    clear()
    setSubmitting(false)
    nav(`/order/${res.orderId}`)
  }

  const [isSubmitting, setSubmitting] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return
      if (window.location.pathname !== '/checkout') return
      const active = document.activeElement as HTMLElement | null
      const tag = active?.tagName?.toLowerCase()
      if (tag === 'input' || tag === 'textarea' || (active && active.getAttribute('role') === 'spinbutton')) return
      if (isSubmitting) return
      e.preventDefault()
      // trigger place order
      void placeOrderClick()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isSubmitting])

  // Escape returns to cart
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (window.location.pathname !== '/checkout') return
      const active = document.activeElement as HTMLElement | null
      const tag = active?.tagName?.toLowerCase()
      if (tag === 'input' || tag === 'textarea' || (active && active.getAttribute('role') === 'spinbutton')) return
      nav('/cart')
    }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [nav])

  if (items.length === 0) {
    return (
      <div className="max-w-md space-y-4">
        <h1 className="text-2xl font-semibold">Checkout</h1>
        <p className="text-gray-600">Your cart is empty.</p>
        <Link to="/" className="inline-block rounded-lg border px-4 py-2 hover:bg-gray-50">
          Back to catalog
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-md space-y-4">
      <h1 className="text-2xl font-semibold">Checkout</h1>
      <p className="text-gray-600">This is a simplified checkout preview.</p>

      <div className="space-y-2">
        {items.map((it) => (
          <div key={it.id} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 3h2l.4 2M7 13h10l4-8H5.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="10" cy="20" r="1" fill="currentColor" />
                <circle cx="18" cy="20" r="1" fill="currentColor" />
              </svg>
              {it.title} × {it.qty}
            </span>
            <span className="font-medium">${(it.price * it.qty).toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between border rounded-lg p-3">
        <span className="font-medium">Order total</span>
        <span className="text-lg font-semibold">{fmtCurrency(total)}</span>
      </div>

      <div className="flex gap-3">
        <Link to="/cart" className="rounded-lg border px-4 py-2 hover:bg-gray-50 flex items-center gap-2">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 3h2l.4 2M7 13h10l4-8H5.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="10" cy="20" r="1" fill="currentColor" />
            <circle cx="18" cy="20" r="1" fill="currentColor" />
          </svg>
          Back to cart
        </Link>
        <button
          onClick={placeOrderClick}
          disabled={isSubmitting}
          aria-busy={isSubmitting}
          className={"rounded-lg bg-blue-600 text-white px-4 py-2 flex items-center gap-2 " + (isSubmitting ? 'opacity-60 cursor-wait' : 'hover:bg-blue-700')}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Place order
        </button>
      </div>
    </div>
  )
}
