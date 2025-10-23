import { useEffect, useRef, useState } from "react";
import { askLLM, listProducts } from "../../lib/api";
import { useCart } from "../../lib/store";

type Message = { role: "user" | "assistant"; text: string };

function renderCitations(txt: string) {
  // Highlight [PolicyX] brackets, keep text otherwise
  const parts = txt.split(/(\[Policy[^\]]+\])/g);
  return parts.map((p, i) =>
    /\[Policy[^\]]+\]/.test(p) ? (
      <span key={i} className="inline-block bg-amber-100 text-amber-900 px-1 rounded mx-0.5">
        {p}
      </span>
    ) : (
      <span key={i}>{p}</span>
    )
  );
}

export default function SupportAssistant() {
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [msgs, setMsgs] = useState<Message[]>([
    { role: "assistant", text: "Hi! How can I help you today?" },
  ]);

  const cart = useCart((s) => s.items);
  const [productsCtx, setProductsCtx] = useState<any[]>([]);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Small context for better answers (optional)
    listProducts().then(setProductsCtx).catch(() => setProductsCtx([]));
  }, []);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, busy]);

  async function send() {
    const prompt = q.trim();
    if (!prompt || busy) return;

    setQ("");
    setMsgs((m) => [...m, { role: "user", text: prompt }]);
    setBusy(true);
    try {
      const res = await askLLM(prompt, {
        cart,
        products: productsCtx.slice(0, 30),
        system:
          "You are Storefront’s helpful assistant. Be concise, cite policies as [PolicyID] when applicable.",
      });
      const text = (res?.output || "").trim() || "Sorry — I had trouble answering that.";
      setMsgs((m) => [...m, { role: "assistant", text }]);
    } catch (e: any) {
      setMsgs((m) => [...m, { role: "assistant", text: String(e?.message || "Error") }]);
    } finally {
      setBusy(false);
    }
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  }

  return (
    <div className="border rounded-xl overflow-hidden flex flex-col">
      <div className="px-4 py-2 border-b bg-gray-50 text-sm font-medium">
        Support Assistant
      </div>
      <div className="p-3 space-y-3 max-h-80 overflow-auto">
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === "assistant" ? "" : "justify-end"}`}>
            <div
              className={`px-3 py-2 rounded-lg max-w-[80%] text-sm whitespace-pre-wrap ${
                m.role === "assistant"
                  ? "bg-gray-100 text-gray-800"
                  : "bg-blue-600 text-white"
              }`}
            >
              {m.role === "assistant" ? renderCitations(m.text) : m.text}
            </div>
          </div>
        ))}
        {busy && (
          <div className="text-xs text-gray-500 px-1">Assistant is typing…</div>
        )}
        <div ref={endRef} />
      </div>
      <div className="p-2 border-t flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onKey}
          placeholder="Ask about policies, orders, or products…"
          className="flex-1 border rounded px-3 py-2"
        />
        <button
          onClick={send}
          disabled={busy || !q.trim()}
          className="rounded bg-blue-600 text-white px-3 py-2 disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
