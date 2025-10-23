// apps/storefront/src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App";

import Catalog from "./pages/catalog";
import Product from "./pages/product";
import Cart from "./pages/cart";
import Checkout from "./pages/checkout";
import OrderStatus from "./pages/order-status";
import AdminDashboard from "./pages/AdminDashboard";
import Support from "./pages/support";
import LoginPage from "./pages/login";
import RequireAuth from "./components/RequireAuth";

import "./index.css";

const router = createBrowserRouter([
  // Public login
  { path: "/login", element: <LoginPage /> },

  // Protected app — App shell is shown only after authentication
  {
    path: "/",
    element: (
      <RequireAuth>
        <App />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Catalog /> },
      { path: "p/:id", element: <Product /> },
      { path: "cart", element: <Cart /> },
      { path: "checkout", element: <Checkout /> },
      { path: "order/:id", element: <OrderStatus /> },
      { path: "support", element: <Support /> },
      { path: "admin", element: <AdminDashboard /> },
    ],
  },

  // fallback -> login
  { path: "*", element: <LoginPage /> },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
