// apps/storefront/src/pages/order-status.tsx
import { useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import OrderTracking from "../components/organisms/OrderTracking";

export default function OrderStatusPage() {
  const { id = "" } = useParams();
  const nav = useNavigate();

  // Keyboard handlers: Escape or Enter → back to catalog
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!/^\/order\//.test(window.location.pathname)) return;
      if (e.key === "Escape" || e.key === "Enter") {
        // Ignore Enter while typing in inputs/textarea/spinbutton
        if (e.key === "Enter") {
          const active = document.activeElement as HTMLElement | null;
          const tag = active?.tagName?.toLowerCase();
          if (tag === "input" || tag === "textarea" || (active && active.getAttribute("role") === "spinbutton")) {
            return;
          }
        }
        e.preventDefault();
        nav("/");
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [nav]);

  if (!id) {
    return (
      <div className="max-w-md mx-auto text-center space-y-6">
        <h1 className="text-2xl font-semibold">Order Status</h1>
        <p className="text-gray-600">Missing order id.</p>
        <Link to="/" className="inline-block mt-6 border rounded-lg px-4 py-2 hover:bg-gray-50">
          Back to Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto text-center space-y-6">
      <h1 className="text-2xl font-semibold">Order Status</h1>
      <p className="text-gray-600">
        Order <span className="font-mono text-gray-800">{id}</span>
      </p>

      {/* Live tracking (SSE) */}
      <OrderTracking orderId={id} />

      <Link to="/" className="inline-block mt-6 border rounded-lg px-4 py-2 hover:bg-gray-50">
        Back to Catalog
      </Link>
    </div>
  );
}
