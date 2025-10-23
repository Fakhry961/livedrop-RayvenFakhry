import { useState } from "react";
import { API } from "../../lib/api";

type Props = {
  onLogin?: (customer: any, token?: string) => void;
};

export default function UserLogin({ onLogin }: Props) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const value = email.trim().toLowerCase();

    if (!value || !value.includes("@")) {
      setErr("Please enter a valid email.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(`${API}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value }),
      });

      if (!res.ok) {
        if (res.status === 404) {
          // Unknown email — show a single clear message
          setErr("Please Enter A Valid Email!");
          return;
        }
        const t = await res.text();
        throw new Error(t || `Login failed (${res.status})`);
      }

      const json = await res.json();
      // persist
      localStorage.setItem("storefront-user", JSON.stringify(json.customer));
      localStorage.setItem("storefront-token", json.token);

      onLogin?.(json.customer, json.token);
    } catch (e: any) {
      setErr(e?.message || "Failed to fetch");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <label className="block text-sm">
        Email
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded border px-3 py-2"
          placeholder="you@example.com"
          type="email"
          autoComplete="email"
        />
      </label>

      {err && <div className="rounded border border-red-200 bg-red-50 p-2 text-red-700 text-sm">{err}</div>}

      <button
        type="submit"
        disabled={busy}
        className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
      >
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
