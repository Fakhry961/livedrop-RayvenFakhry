import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listProducts, type Product } from '../lib/api'
import { fmtCurrency } from '../lib/format'
import { useCart } from '../lib/store'

export default function Catalog() {
  const [data, setData] = useState<Product[]>([])
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<'default' | 'price-asc' | 'price-desc'>('default')
  const [tag, setTag] = useState<string | null>(null)
  const add = useCart(s => s.add)

  useEffect(() => {
    listProducts().then(setData)
  }, [])

  // Prevent Enter/Escape from bubbling to global handlers while on catalog
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' && e.key !== 'Escape') return
      const active = document.activeElement as HTMLElement | null
      const tag = active?.tagName?.toLowerCase()
      // if user is typing in an input/textarea/spinbutton, allow normal behavior
      if (tag === 'input' || tag === 'textarea' || (active && active.getAttribute('role') === 'spinbutton')) return
      // swallow the key so other global handlers (if any) don't act
      e.preventDefault()
      e.stopPropagation()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const tags = Array.from(new Set(data.flatMap(d => d.tags)))

  let filtered = data.filter(p =>
    (p.title.toLowerCase().includes(q.toLowerCase()) || p.tags.some(t => t.toLowerCase().includes(q.toLowerCase()))) &&
    (tag ? p.tags.includes(tag) : true)
  )

  if (sort === 'price-asc') filtered = filtered.slice().sort((a, b) => a.price - b.price)
  if (sort === 'price-desc') filtered = filtered.slice().sort((a, b) => b.price - a.price)

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <div className="relative w-full max-w-md">
          <svg className="w-4 h-4 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search products..."
            aria-label="Search products"
            className="w-full rounded-md border pl-8 pr-3 py-2"
          />
        </div>
  </div>

      <div className="mb-4 flex items-center gap-3">
        <label className="text-sm">Sort:</label>
        <select value={sort} onChange={(e) => setSort(e.target.value as any)} className="border rounded px-2 py-1 text-sm">
          <option value="default">Default</option>
          <option value="price-asc">Price: Low → High</option>
          <option value="price-desc">Price: High → Low</option>
        </select>

        <div className="ml-4 flex items-center gap-2">
          <label className="text-sm">Filter by tag:</label>
          <select value={tag ?? ''} onChange={(e) => setTag(e.target.value || null)} className="border rounded px-2 py-1 text-sm">
            <option value="">All</option>
            {tags.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(p => (
          <div key={p.id} className="border rounded-xl p-4">
            <Link to={`/p/${p.id}`} className="block">
              <img
                src={p.image}
                alt={p.title}
                loading="lazy"
                className="w-full h-40 object-cover rounded-md"
              />
              <h3 className="mt-3 font-semibold">{p.title}</h3>
            </Link>
            <div className="mt-1 text-sm text-gray-500">{fmtCurrency(p.price)}</div>
            <button
              className="mt-3 rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
              onClick={() => add(p)}
            >
              <svg className="w-4 h-4 text-gray-700" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><circle cx="10" cy="20" r="1" fill="currentColor" /><circle cx="18" cy="20" r="1" fill="currentColor" /></svg>
              Add to cart
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
