// apps/storefront/src/pages/AdminDashboard.tsx
import { useEffect, useMemo, useState } from "react";
import { API } from "../lib/api";
import { fmtCurrency } from "../lib/format";

type DailyPoint = { date: string; revenue: number };
type TopItem = { id: string; title?: string; units?: number; revenue?: number };
type StockItem = { id: string; title?: string; stockQty?: number };
type RecentOrder = {
  _id: string;
  status?: string;
  createdAt?: string;
  items?: Array<{ sku: string; qty: number; title?: string; price?: number }>;
  amounts?: { total?: number };
  customerId?: string | null;
};

type Overview = {
  ordersToday?: number;
  revenueToday?: number;
  customersTotal?: number;
  topProducts?: TopItem[];
  lowStock?: StockItem[];
  recentOrders?: RecentOrder[];
};

const DAYS = 7;

export default function AdminDashboard() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [series, setSeries] = useState<DailyPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    async function run() {
      setLoading(true);
      setErr(null);
      try {
        const [oRes, sRes] = await Promise.all([
          fetch(`${API}/api/dashboard/overview`),
          // ensure we always request a fixed window (7 days)
          fetch(`${API}/api/analytics/daily-revenue?days=${DAYS}`),
        ]);

        if (!oRes.ok) throw new Error(await oRes.text());
        if (!sRes.ok) throw new Error(await sRes.text());

        const oJson = (await oRes.json()) as Overview;
        const sJson = (await sRes.json()) as { points?: DailyPoint[] } | DailyPoint[];
        if (!alive) return;

        const points = Array.isArray(sJson) ? sJson : sJson?.points ?? [];
        setOverview(oJson || {});
        setSeries(points);
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.message || "Failed to load admin data.");
      } finally {
        if (alive) setLoading(false);
      }
    }
    run();
    return () => {
      alive = false;
    };
  }, []);

  const totals = useMemo(() => {
    const rev = (overview?.revenueToday ?? 0) || 0;
    const ord = (overview?.ordersToday ?? 0) || 0;
    const cust = (overview?.customersTotal ?? 0) || 0;
    return { rev, ord, cust };
  }, [overview]);

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <span className="text-sm text-gray-500">Live store overview</span>
      </header>

      {loading && <div className="text-sm text-gray-500">Loading metrics…</div>}
      {err && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {err}
        </div>
      )}

      {!loading && !err && (
        <section className="grid gap-4 sm:grid-cols-3">
          <Card
            title="Orders Today"
            value={totals.ord.toLocaleString()}
            icon={
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M7 4h10l1 4H6l1-4Z" />
                <path d="M6 8h12l-1.5 9h-9L6 8Z" />
              </svg>
            }
          />
          <Card
            title="Revenue Today"
            value={fmtCurrency(totals.rev)}
            icon={
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 1v22M5 7h8a4 4 0 1 1 0 8H7a4 4 0 0 0 0 8h10" />
              </svg>
            }
          />
          <Card
            title="Customers"
            value={totals.cust.toLocaleString()}
            icon={
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Z" />
                <path d="M4 22a8 8 0 0 1 16 0Z" />
              </svg>
            }
          />
        </section>
      )}

      {!loading && !err && (
        <section className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-xl border p-4 lg:col-span-2">
            <div className="mb-1 flex items-center justify-between">
              <h2 className="font-medium">Daily Revenue (last {DAYS} days)</h2>
              <span className="text-xs text-gray-500">
                Source: <code>/api/analytics/daily-revenue?days={DAYS}</code>
              </span>
            </div>
            <Sparkline data={series} />
          </div>

          <div className="rounded-xl border p-4">
            <div className="mb-1 flex items-center justify-between">
              <h2 className="font-medium">Top Products</h2>
              <span className="text-xs text-gray-500">Today</span>
            </div>
            <ul className="divide-y">
              {(overview?.topProducts ?? []).slice(0, 6).map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="truncate">{p.title ?? p.id}</span>
                  <span className="tabular-nums text-gray-600">{p.units ?? 0} sold</span>
                </li>
              ))}
              {(!overview?.topProducts || overview.topProducts.length === 0) && (
                <li className="py-2 text-sm text-gray-500">No sales yet.</li>
              )}
            </ul>
          </div>
        </section>
      )}

      {!loading && !err && (
        <section className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-xl border p-4">
            <h2 className="mb-2 font-medium">Low Stock</h2>
            <ul className="divide-y">
              {(overview?.lowStock ?? []).slice(0, 8).map((i) => (
                <li key={i.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="truncate">{i.title ?? i.id}</span>
                  <span className="tabular-nums text-orange-600">{i.stockQty ?? 0}</span>
                </li>
              ))}
              {(!overview?.lowStock || overview.lowStock.length === 0) && (
                <li className="py-2 text-sm text-gray-500">All good 👍</li>
              )}
            </ul>
          </div>

          <div className="rounded-xl border p-4 lg:col-span-2 overflow-x-auto">
            <h2 className="mb-2 font-medium">Recent Orders</h2>
            <table className="w-full text-left text-sm">
              <thead className="text-gray-500">
                <tr>
                  <th className="py-1 pr-4">Order</th>
                  <th className="py-1 pr-4">Created</th>
                  <th className="py-1 pr-4">Items</th>
                  <th className="py-1 pr-4">Total</th>
                  <th className="py-1">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(overview?.recentOrders ?? []).slice(0, 10).map((o) => (
                  <tr key={o._id}>
                    <td className="py-2 pr-4 font-medium truncate">{o._id}</td>
                    <td className="py-2 pr-4">
                      {o.createdAt ? new Date(o.createdAt).toLocaleString() : "-"}
                    </td>
                    <td className="py-2 pr-4">
                      {o.items?.reduce((n, it) => n + (it.qty || 0), 0) ?? 0}
                    </td>
                    <td className="py-2 pr-4">{fmtCurrency(o.amounts?.total ?? 0)}</td>
                    <td className="py-2">
                      <Badge>{o.status ?? "—"}</Badge>
                    </td>
                  </tr>
                ))}
                {(!overview?.recentOrders || overview.recentOrders.length === 0) && (
                  <tr>
                    <td colSpan={5} className="py-4 text-gray-500">
                      No orders yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

/* ---------- UI helpers ---------- */

function Card({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">{title}</span>
        <span className="text-gray-400">{icon}</span>
      </div>
      <div className="mt-2 text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  const t = String(children || "").toUpperCase();
  const color =
    t === "PENDING"
      ? "bg-gray-100 text-gray-700"
      : t === "PROCESSING"
      ? "bg-blue-100 text-blue-700"
      : t === "SHIPPED"
      ? "bg-purple-100 text-purple-700"
      : t === "DELIVERED" || t === "COMPLETED"
      ? "bg-green-100 text-green-700"
      : t === "CANCELLED"
      ? "bg-red-100 text-red-700"
      : "bg-gray-100 text-gray-700";
  return <span className={`inline-flex rounded px-2 py-0.5 text-xs ${color}`}>{children}</span>;
}

function Sparkline({ data }: { data: DailyPoint[] }) {
  if (!data || data.length === 0) return <div className="text-sm text-gray-500">No data</div>;

  const w = 640;
  const h = 140;
  const pad = 8;

  const xs = data.map((_, i) => pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1));
  const vals = data.map((d) => d.revenue ?? 0);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = Math.max(1, max - min);
  const ys = vals.map((v) => h - pad - ((v - min) * (h - pad * 2)) / span);
  const path = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x},${ys[i]}`).join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
      <path d={path} fill="none" stroke="currentColor" className="text-blue-600" strokeWidth="2" />
      <path
        d={`${path} L ${xs[xs.length - 1]},${h - pad} L ${xs[0]},${h - pad} Z`}
        className="text-blue-100"
        fill="currentColor"
        opacity={0.7}
      />
      <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="#e5e7eb" />
    </svg>
  );
}
