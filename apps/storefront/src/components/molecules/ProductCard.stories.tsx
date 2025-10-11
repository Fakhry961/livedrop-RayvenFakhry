import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import ProductCard from './ProductCard'

const meta: Meta<typeof ProductCard> = {
  title: 'Molecules/ProductCard',
  component: ProductCard,
  decorators: [(Story) => <MemoryRouter><Story /></MemoryRouter>],
}
export default meta
type Story = StoryObj<typeof ProductCard>

const base = {
  id:"sku-001",title:"Basic Tee",price:18.5,image:"https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80",tags:["clothes","tops"],stockQty:12,desc:"Soft cotton T-shirt made from premium combed cotton."
}

export const Default: Story = { args: { p: base } }
export const SoldOut: Story = { args: { p: { ...base, stockQty: 0 } } }
