import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { placeOrder, listProducts, type Product } from "../lib/api";
import { useCart } from "../lib/store";
import { fmtCurrency } from "../lib/format";

export default function Checkout() {
  const nav = useNavigate();
  const items = useCart((s) => s.items);
  const clear = useCart((s) => s.clear);

  // derive total from mock catalog prices (defensive: if a product disappears, price 0)
  const [catalog, setCatalog] = useState<Product[] | null>(null);
  useMemo(() => {
    listProducts().then(setCatalog).catch(() => setCatalog([]));
  }, []);

  const total = useMemo(() => {
    if (!catalog) return 0;
    return items.reduce((sum, it) => {
      const p = catalog.find((c) => c.id === it.id);
      return sum + (p?.price ?? 0) * it.qty;
    }, 0);
  }, [catalog, items]);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handlePlaceOrder() {
    setErr(null);
    if (!items.length) {
      setErr("Your cart is empty.");
      return;
    }
    setBusy(true);
    try {
      // Send only id/qty; server will validate/prices from DB
      const res = await placeOrder(items.map((i) => ({ id: i.id, qty: i.qty })));
      clear();                       // empty cart after a successful order
      nav(`/order/${encodeURIComponent(res.orderId)}`);
    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold">Checkout</h1>
      <p className="text-gray-600 mt-1">This is a simplified checkout preview.</p>

      <div className="mt-6 space-y-2">
        {items.map((i) => (
          <div key={i.id} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M3 3h2l.4 2M7 13h10l4-8H5.4" stroke="currentColor" strokeWidth="1.5"
                  strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-gray-700">{i.title ?? i.id}</span>
              <span className="text-gray-400">× {i.qty}</span>
            </div>
            <span className="tabular-nums">
              {fmtCurrency(
                (catalog?.find((p) => p.id === i.id)?.price ?? 0) * i.qty
              )}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-6 border rounded-lg p-3 flex items-center justify-between">
        <div className="text-sm text-gray-600">Order total</div>
        <div className="font-medium">{fmtCurrency(total)}</div>
      </div>

      {err && <div className="mt-3 text-sm text-red-600">{err}</div>}

      <div className="mt-4 flex gap-3">
        <Link to="/cart" className="border rounded-lg px-3 py-2 hover:bg-gray-50">
          ← Back to cart
        </Link>
        <button
          className="rounded-lg px-4 py-2 bg-blue-500 text-white disabled:opacity-50"
          onClick={handlePlaceOrder}
          disabled={busy || !items.length}
        >
          {busy ? "Placing…" : "✓ Place order"}
        </button>
      </div>
    </div>
  );
}
