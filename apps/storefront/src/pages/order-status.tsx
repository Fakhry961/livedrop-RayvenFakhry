import { useEffect, useMemo, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getOrderStatus } from '../lib/api'

const steps = ['Placed', 'Packed', 'Shipped', 'Delivered'] as const
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

type Timing = { startTs: number; intervalMs: number; startStep: number }

export default function OrderStatusPage() {
  const { id = '' } = useParams()
  const storageKey = useMemo(() => (id ? `order:${id}:timing` : ''), [id])

  const [timing, setTiming] = useState<Timing | null>(null)
  const [now, setNow] = useState(() => Date.now())

  // Initialize timing once per order (and persist it)
  useEffect(() => {
    let cancelled = false
    if (!id || !storageKey) return

    const saved = localStorage.getItem(storageKey)
    if (saved) {
      setTiming(JSON.parse(saved))
      return
    }

    ;(async () => {
      const info = await getOrderStatus(id)
      const startStep = clamp(steps.indexOf(info.status), 0, steps.length - 1)
      const intervalMs = 2000 + Math.floor(Math.random() * 2000) // 2–4s
      const t: Timing = { startTs: Date.now(), intervalMs, startStep }
      if (!cancelled) {
        localStorage.setItem(storageKey, JSON.stringify(t))
        setTiming(t)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [id, storageKey])

  // Tick on the same interval so progress is stable (and survives refresh)
  useEffect(() => {
    if (!timing) return
    const tick = () => setNow(Date.now())
    const h = setInterval(tick, timing.intervalMs)
    tick()
    return () => clearInterval(h)
  }, [timing])

  // Add keyboard handlers: Enter -> go to catalog (/), Escape -> catalog
  const nav = useNavigate()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!/^\/order\//.test(window.location.pathname)) return
      if (e.key === 'Escape') {
        e.preventDefault()
        // SPA navigate back to catalog
        nav('/')
      }
      if (e.key === 'Enter') {
        // Ignore Enter while typing into inputs or textareas or spinbuttons
        const active = document.activeElement as HTMLElement | null
        const tag = active?.tagName?.toLowerCase()
        if (tag === 'input' || tag === 'textarea' || (active && active.getAttribute('role') === 'spinbutton')) return
        e.preventDefault()
        // SPA navigate to catalog
        nav('/')
      }
    }

    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [nav])

  if (!timing) return <div>Loading order status…</div>

  const elapsedSteps = Math.floor((now - timing.startTs) / timing.intervalMs)
  const currentStep = clamp(timing.startStep + elapsedSteps, 0, steps.length - 1)

  const status = steps[currentStep]
  const carrier = currentStep >= 2 ? 'Storefront Carrier' : null
  const eta = currentStep === steps.length - 1 ? null : '3–5 days'

  return (
    <div className="max-w-md mx-auto text-center space-y-6">
      <h1 className="text-2xl font-semibold">Order Status</h1>
      <p className="text-gray-600">
        Order <span className="font-mono text-gray-800">{id}</span>
      </p>

      {/* Stepper */}
      <div className="flex justify-between items-center mt-8 relative">
        {steps.map((s, i) => (
          <div key={s} className="flex-1 flex flex-col items-center relative z-10">
            <div
              className={`w-8 h-8 flex items-center justify-center rounded-full border-2 transition
                ${i <= currentStep ? 'border-green-500 bg-green-500 text-white' : 'border-gray-300 text-gray-400'}`}
            >
              {i + 1}
            </div>
            <div className="text-xs mt-2">{s}</div>
          </div>
        ))}
        <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-200 z-0" />
        <div
          className="absolute top-4 left-4 h-0.5 bg-green-500 z-0 transition-all duration-700"
          style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
        />
      </div>

      {/* Details */}
      <div className="mt-8 space-y-2">
        <p>
          <span className="font-medium">Current status:</span>{' '}
          <span className="text-green-600 font-semibold">{status}</span>
        </p>
        {carrier && (
          <p>
            <span className="font-medium">Carrier:</span> {carrier}
          </p>
        )}
        {eta && (
          <p>
            <span className="font-medium">Estimated delivery:</span> {eta}
          </p>
        )}
      </div>

      {currentStep >= steps.length - 1 ? (
        <p className="text-green-600 font-semibold mt-4">✅ Delivered successfully!</p>
      ) : (
        <p className="text-gray-500 text-sm mt-4 animate-pulse">Updating status…</p>
      )}

      <Link to="/" className="inline-block mt-6 border rounded-lg px-4 py-2 hover:bg-gray-50">
        Back to Catalog
      </Link>
    </div>
  )
}
