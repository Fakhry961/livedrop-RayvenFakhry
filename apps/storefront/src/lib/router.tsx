import { createBrowserRouter } from 'react-router-dom'
import App from '../App'
import Catalog from '../pages/catalog'
import Product from '../pages/product'
import Cart from '../pages/cart'
import Checkout from '../pages/checkout'
import OrderStatus from '../pages/order-status'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Catalog /> },
      { path: 'p/:id', element: <Product /> },
      { path: 'cart', element: <Cart /> },
      { path: 'checkout', element: <Checkout /> },
      { path: 'order/:id', element: <OrderStatus /> }
    ]
  }
])
