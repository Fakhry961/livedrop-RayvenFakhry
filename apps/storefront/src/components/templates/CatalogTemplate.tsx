// src/components/templates/CatalogTemplate.tsx
import * as React from 'react'
import ProductGrid from '../organisms/ProductGrid'
import type { Product } from '../../lib/api'

type CatalogTemplateProps = {
  title?: string
  items: Product[]
  children?: React.ReactNode
}

export default function CatalogTemplate({
  title = 'Catalog',
  items,
  children,
}: CatalogTemplateProps) {
  return (
    <section className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
        {/* area for search/filter/sort controls */}
        {children}
      </header>

      <ProductGrid items={items} />
    </section>
  )
}
