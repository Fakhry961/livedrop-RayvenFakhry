import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import CatalogTemplate from './CatalogTemplate'

const meta: Meta<typeof CatalogTemplate> = {
  title: 'Templates/CatalogTemplate',
  component: CatalogTemplate,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <div className="p-6 bg-gray-50 min-h-screen">
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
}
export default meta
type Story = StoryObj<typeof CatalogTemplate>

const sampleItems = [
    {"id":"sku-001","title":"Basic Tee","price":18.5,"image":"https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80","tags":["clothes","tops"],"stockQty":12,"desc":"Soft cotton T-shirt made from premium combed cotton."},
    {"id":"sku-002","title":"Blue Hoodie","price":42.0,"image":"https://images.unsplash.com/photo-1638417286482-9a9389ee6dd4?auto=format&fit=crop&w=800&q=80","tags":["clothes","outerwear"],"stockQty":5,"desc":"Cozy fleece hoodie with drawstring and kangaroo pocket."},
    {"id":"sku-003","title":"Running Shoes","price":69.9,"image":"https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=800&q=80","tags":["shoes","sport"],"stockQty":20,"desc":"Lightweight running shoes designed for comfort and performance."},
]

export const Default: Story = {
  args: {
    title: 'Catalog',
    items: sampleItems,
  },
}
