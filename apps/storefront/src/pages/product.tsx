import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getProduct, listProducts, type Product } from '../lib/api'
import { fmtCurrency } from '../lib/format'
import { useCart } from '../lib/store'

export default function ProductPage() {
  const { id = '' } = useParams()
  const [p, setP] = useState<Product | null>(null)
  const add = useCart(s => s.add)
  const items = useCart(s => s.items)
  const inCart = (id: string) => items.find(i => i.id === id)?.qty ?? 0

  useEffect(() => {
    getProduct(id).then(prod => setP(prod ?? null))
  }, [id])

  if (!p) return <div>Loading…</div>

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <img
        src={p.image}
        alt={p.title}
        loading="lazy"
        className="w-full rounded-xl object-cover object-top"
      />
      <div>
        <h1 className="text-2xl font-semibold">{p.title}</h1>
        <p className="mt-2 text-gray-600">{p.desc}</p>
        <div className="mt-3 text-lg font-medium">{fmtCurrency(p.price)}</div>
        <div className="mt-1 text-sm text-gray-500">{(p.stockQty - inCart(p.id)) > 0 ? `${p.stockQty - inCart(p.id)} available` : 'Out of stock'}</div>
        <button
          className="mt-4 rounded-lg border px-3 py-2 hover:bg-gray-50"
          onClick={() => add(p)}
          disabled={(p.stockQty - inCart(p.id)) <= 0}
        >
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-700" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><circle cx="10" cy="20" r="1" fill="currentColor" /><circle cx="18" cy="20" r="1" fill="currentColor" /></svg>
            <span>{(p.stockQty - inCart(p.id)) > 0 ? 'Add to cart' : 'Sold out'}</span>
          </div>
        </button>
      </div>
      <div className="md:col-span-2">
        <h2 className="mt-8 text-lg font-semibold">Related items</h2>
        <RelatedItems current={p} />
      </div>
    </div>
  )
}

function RelatedItems({ current }: { current: Product }) {
  const [items, setItems] = useState<Product[]>([])
  useEffect(() => {
    listProducts().then(all => {
      const related = all.filter(a => a.id !== current.id && a.tags.some(t => current.tags.includes(t)))
      setItems(related.slice(0, 3))
    })
  }, [current])
  if (items.length === 0) return <div className="text-sm text-gray-500 mt-2">No related items</div>
  return (
    <div className="grid grid-cols-3 gap-4 mt-3">
      {items.map(i => (
        <a key={i.id} className="block border rounded p-2 text-sm" href={`#/p/${i.id}`}>
          <img src={i.image} alt={i.title} loading="lazy" className="w-full h-20 object-cover rounded" />
          <div className="mt-2 font-medium">{i.title}</div>
          <div className="text-gray-500 text-sm">{fmtCurrency(i.price)}</div>
        </a>
      ))}
    </div>
  )
}
