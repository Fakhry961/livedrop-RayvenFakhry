// src/lib/store.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Product } from './api'

/**
 * Internal cart item shape used in persisted state — a Product plus a quantity.
 */
type CartItem = Product & { qty: number }

/**
 * The cart store API exposed by `useCart`.
 *
 * - `items`: current cart lines
 * - `add(p)`: add one unit of product `p` (caps at stockQty)
 * - `remove(id)`: remove a line entirely
 * - `inc(id)`: increment quantity by 1 (caps at stockQty)
 * - `dec(id)`: decrement quantity by 1 (removes line at 0)
 * - `clear()`: empty the cart
 */
type CartState = {
  items: CartItem[]
  add: (p: Product) => void
  remove: (id: string) => void
  inc: (id: string) => void
  dec: (id: string) => void
  clear: () => void
}

/**
 * A persisted Zustand hook for the shopping cart. The store is persisted to
 * localStorage under the `storefront-cart` key so cart state survives reloads.
 */
export const useCart = create<CartState>()(
  persist(
  (set, _get) => ({
      items: [],

      add: (p) =>
        set((s) => {
          const ex = s.items.find(i => i.id === p.id)
          if (ex) {
            // cap by stock
            if (ex.qty >= p.stockQty) return s
            return { items: s.items.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i) }
          }
          // new line
          if (p.stockQty <= 0) return s
          return { items: [...s.items, { ...p, qty: 1 }] }
        }),

      remove: (id) => set((s) => ({ items: s.items.filter(i => i.id !== id) })),

      inc: (id) =>
        set((s) => {
          const it = s.items.find(i => i.id === id)
          if (!it) return s
          // cap by stock
          if (it.qty >= it.stockQty) return s
          return { items: s.items.map(i => i.id === id ? { ...i, qty: i.qty + 1 } : i) }
        }),

      dec: (id) =>
        set((s) => ({
          items: s.items
            .map(i => i.id === id ? { ...i, qty: Math.max(0, i.qty - 1) } : i)
            .filter(i => i.qty > 0),
        })),

      clear: () => set({ items: [] }),
    }),
    {
      name: 'storefront-cart',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
