import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import RequireAuth from "../components/RequireAuth";
import { Navigate } from "react-router-dom";

// Existing pages

// Catalog page moved into main router; remove unused import to satisfy TS noUnusedLocals
import CartPage from "../pages/cart";
import CheckoutPage from "../pages/checkout";
import ProductPage from "../pages/product";
import OrderStatusPage from "../pages/order-status";

// New pages we just created
import SupportPage from "../pages/support";
import LoginPage from "../pages/login";
import AdminDashboard from "../pages/AdminDashboard";

// Optional simple error element so 404s are nicer
function NotFound() {
  return (
    <div className="text-center text-sm text-gray-600">
      <p className="text-lg font-semibold mb-2">404 Not Found</p>
      <p>That page doesn’t exist.</p>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <NotFound />,
    children: [
      // Redirect root to login
      { index: true, element: <Navigate to="/login" replace /> },

      // Public
      { path: "login", element: <LoginPage /> },

      // Protected (require login)
      { path: "cart", element: <RequireAuth>{<CartPage />}</RequireAuth> },
      { path: "checkout", element: <RequireAuth>{<CheckoutPage />}</RequireAuth> },
      { path: "p/:id", element: <RequireAuth>{<ProductPage />}</RequireAuth> },
      { path: "order/:id", element: <RequireAuth>{<OrderStatusPage />}</RequireAuth> },
      { path: "admin", element: <RequireAuth>{<AdminDashboard />}</RequireAuth> },

      // Support page can be public but redirect to login if you want it private
      { path: "support", element: <SupportPage /> },

      // Fallback
      { path: "*", element: <NotFound /> },
    ],
  },
]);
