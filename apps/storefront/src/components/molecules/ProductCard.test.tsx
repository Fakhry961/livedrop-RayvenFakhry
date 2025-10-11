import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ProductCard from './ProductCard'

// mock cart store (only add is used here)
vi.mock('../../lib/store', async () => {
  const actual = await vi.importActual<any>('../../lib/store')
  return {
    ...actual,
    useCart: (sel: any) => sel({
      items: [],
      add: vi.fn(),
      inc: vi.fn(), dec: vi.fn(), remove: vi.fn(), clear: vi.fn(),
    }),
  }
})

const p = {
  id: 'p1',
  title: 'Blue Hoodie',
  price: 49.99,
  image: '/mock.jpg',
  tags: ['hoodie','blue'],
  stockQty: 3,
}

it('renders title, price and image', () => {
  render(
    <MemoryRouter>
      <ProductCard p={p} />
    </MemoryRouter>
  )
  expect(screen.getByText(/Blue Hoodie/i)).toBeInTheDocument()
  expect(screen.getByText('$49.99')).toBeInTheDocument()
  expect(screen.getByRole('img', { name: /Blue Hoodie/i })).toBeInTheDocument()
})

it('has an accessible Add to cart button', () => {
  render(
    <MemoryRouter>
      <ProductCard p={p} />
    </MemoryRouter>
  )
  expect(screen.getByRole('button', { name: /add to cart/i })).toBeEnabled()
})
