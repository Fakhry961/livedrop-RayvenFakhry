import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import * as store from '../lib/store'
import Cart from './cart'

const baseItems = [
  { id:'p1', title:'Item A', price:10, image:'', tags:[], stockQty:2, qty:1 },
  { id:'p2', title:'Item B', price:5,  image:'', tags:[], stockQty:5, qty:2 },
]

function mockCart(items = baseItems) {
  vi.spyOn(store, 'useCart').mockImplementation((sel: any) => sel({
    items,
    add: vi.fn(), inc: vi.fn(), dec: vi.fn(), remove: vi.fn(), clear: vi.fn(),
  }))
}

it('shows line totals and overall total', () => {
  mockCart()
  render(
    <MemoryRouter>
      <Cart />
    </MemoryRouter>
  )
  // $10.00 for A, $10.00 for B line, $20.00 total
  expect(screen.getAllByText('$10.00').length).toBeGreaterThanOrEqual(2)
  expect(screen.getByText('$20.00')).toBeInTheDocument()
})

it('disables + when qty reaches stock', () => {
  mockCart([{ ...baseItems[0], qty: 2 }]) // at stock cap
  render(
    <MemoryRouter>
      <Cart />
    </MemoryRouter>
  )
  const incBtn = screen.getByRole('button', { name: /increase quantity/i })
  expect(incBtn).toBeDisabled()
})
