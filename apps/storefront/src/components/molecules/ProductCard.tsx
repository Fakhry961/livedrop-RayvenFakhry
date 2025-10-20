// React import not required with the new JSX transform
import Button from '../atoms/Button'
import { fmtCurrency } from '../../lib/format'
import { useCart } from '../../lib/store'
import type { Product } from '../../lib/api'

export default function ProductCard({ p }: { p: Product }) {
  const add = useCart((s) => s.add)
  const items = useCart(s => s.items)
  const inCart = items.find(i => i.id === p.id)?.qty ?? 0
  const available = Math.max(0, p.stockQty - inCart)

  return (
    <div className="border rounded-xl p-4 flex flex-col gap-3 shadow-sm bg-white">
      <img
        src={p.image}
        alt={p.title}
        className="aspect-square object-cover rounded-lg"
        loading="lazy"
      />
      <div className="flex-1">
        <h3 className="font-medium text-gray-900 line-clamp-1">{p.title}</h3>
        <p className="text-sm text-gray-600">{fmtCurrency(p.price)}</p>
  <p className="text-xs text-gray-500 mt-1">{available > 0 ? `${available} in stock` : 'Out of stock'}</p>
      </div>
      <Button
        onClick={() => add(p)}
        variant="primary"
        className="w-full"
        disabled={available <= 0}
      >
        {available > 0 ? 'Add to Cart' : 'Sold out'}
      </Button>
    </div>
  )
}
