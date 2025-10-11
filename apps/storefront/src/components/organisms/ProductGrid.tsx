// src/components/organisms/ProductGrid.tsx
import * as React from 'react'
import ProductCard from '../molecules/ProductCard'
import type { Product } from '../../lib/api'

export default function ProductGrid({ items }: { items: Product[] }) {
  if (!items?.length) {
    return (
      <p className="text-gray-500 text-center py-10">
        No products found.
      </p>
    )
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((p) => (
        <ProductCard key={p.id} p={p} />
      ))}
    </div>
  )
}
