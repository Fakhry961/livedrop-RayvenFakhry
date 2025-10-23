import { useEffect, useState, useMemo } from "react";
import { SSEClient } from "../../lib/sse-client";
import { API } from "../../lib/api";

type OrderStatus = {
  status: string;
  eta?: string | null;
  lastUpdate?: string;
};

const STEPS = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED"];

function statusToIndex(s: string) {
  const v = String(s || "").toUpperCase();
  if (v.startsWith("PEND") || v === "PENDING" || v === "PLACED") return 0;
  if (v.startsWith("PROC") || v === "PROCESSING" || v === "PACKED") return 1;
  if (v.startsWith("SHIP") || v === "SHIPPED") return 2;
  if (v.startsWith("DELIV") || v === "DELIVERED" || v === "COMPLETE" || v === "COMPLETED") return 3;
  return 0;
}

export default function OrderTracking({ orderId }: { orderId: string }) {
  const [status, setStatus] = useState<OrderStatus>({ status: "PENDING" });
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!orderId) return;

    const sse = new SSEClient(`${API}/api/orders/${orderId}/stream`, {
      onOpen: () => setConnected(true),
      onMessage: (m) => {
        const ev = m.data;
        if (!ev) return;

        if (ev.type === "status") {
          setStatus((s) => ({
            ...s,
            status: ev.status,
            lastUpdate: new Date().toLocaleTimeString(),
          }));
        }

        if (ev.type === "eta") {
          setStatus((s) => ({ ...s, eta: ev.eta }));
        }
      },
      onError: () => setConnected(false),
    });

    sse.start();
    return () => sse.close();
  }, [orderId]);

  const active = useMemo(() => statusToIndex(status.status), [status.status]);

  return (
    <div className="p-6 rounded-lg mt-6 bg-white shadow-sm">
      <h2 className="text-xl font-semibold mb-6">Order {orderId} Progress</h2>

      <div className="flex items-center gap-6">
        {STEPS.map((label, i) => {
          const isDone = i < active;
          const isActive = i === active;
          return (
            <div key={label} className="flex-1 text-center">
              <div className="flex items-center justify-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${isDone ? 'bg-green-500 border-green-500' : isActive ? 'bg-blue-500 border-blue-500' : 'bg-gray-100 border-gray-200'}`}
                >
                  {isDone ? (
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  ) : (
                    <span className={`${isActive ? 'text-white' : 'text-gray-600'} font-medium`}>{i + 1}</span>
                  )}
                </div>
              </div>
              <div className={`mt-3 text-sm font-semibold ${isDone ? 'text-gray-700' : isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                {label}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 text-center">
        <div className="text-sm text-gray-600">Status:</div>
        <div className="text-2xl font-bold mt-1">{STEPS[active]}</div>
      </div>

      <div className="mt-4 text-sm text-gray-500 text-center">
        Connection: {connected ? "🟢 Live" : "🔴 Disconnected"}
      </div>
    </div>
  );
}
