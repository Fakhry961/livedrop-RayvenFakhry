import { Link, NavLink, Outlet } from "react-router-dom";
import { Suspense, useMemo } from "react";
import AssistantPanel from "./assistant/panel";
import { useCart } from "./lib/store";
import { useNavigate } from "react-router-dom";
import { clearAuth } from "./lib/auth";

export default function App() {
  const total = useCart((s) => s.items.reduce((sum, i) => sum + i.qty, 0));
  const navigate = useNavigate();

  // read lightweight user display (non-blocking; safe-guarded)
  const userEmail = useMemo(() => {
    try {
      const raw = localStorage.getItem("storefront-user");
      if (!raw) return null;
      const u = JSON.parse(raw);
      return typeof u?.email === "string" ? u.email : null;
    } catch {
      return null;
    }
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/70">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-3" aria-label="Go to home">
            <img src="/logo.svg" alt="Storefront" className="w-6 h-6" />
            <span className="text-xl font-bold text-blue-600">Storefront</span>
          </Link>

          <nav className="flex items-center gap-4" aria-label="Primary">
            <NavLink
              className={({ isActive }) =>
                `hover:underline flex items-center gap-2 ${isActive ? "text-blue-700" : ""}`
              }
              to="/"
              aria-label="Browse catalog"
            >
              <svg
                className="w-4 h-4 text-gray-600"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <rect x="3" y="3" width="8" height="8" stroke="currentColor" strokeWidth="1.5" rx="1" />
                <rect x="13" y="3" width="8" height="8" stroke="currentColor" strokeWidth="1.5" rx="1" />
                <rect x="3" y="13" width="8" height="8" stroke="currentColor" strokeWidth="1.5" rx="1" />
                <rect x="13" y="13" width="8" height="8" stroke="currentColor" strokeWidth="1.5" rx="1" />
              </svg>
              <span>Catalog</span>
            </NavLink>

            <NavLink
              className={({ isActive }) =>
                `hover:underline flex items-center gap-2 ${isActive ? "text-blue-700" : ""}`
              }
              to="/cart"
              aria-label={`Cart, ${total} item${total === 1 ? "" : "s"}`}
            >
              {/* Cart icon with badge */}
              <span className="relative inline-flex">
                <svg
                  className="w-5 h-5 text-gray-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="10" cy="20" r="1" fill="currentColor" />
                  <circle cx="18" cy="20" r="1" fill="currentColor" />
                </svg>
                {total > 0 && (
                  <span
                    className="absolute -top-1 -right-1 flex items-center justify-center rounded-full bg-red-600 text-white text-[10px] min-w-[14px] h-[14px] px-[3px] leading-none"
                    aria-label={`${total} item${total === 1 ? "" : "s"} in cart`}
                  >
                    {total}
                  </span>
                )}
              </span>
              <span>Cart</span>
            </NavLink>

            {/* Support (icon + text) */}
            <NavLink to="/support" aria-label="Support" title="Support" className={({ isActive }) => `flex items-center gap-2 px-2 py-1 rounded ${isActive ? 'text-blue-700' : ''}`}>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M21 15a2 2 0 0 1-2 2H8l-5 3V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-sm">Support</span>
            </NavLink>

            {/* Admin (icon + text) - keep visible for dev */}
            <NavLink to="/admin" aria-label="Admin" title="Admin" className={({ isActive }) => `flex items-center gap-2 px-2 py-1 rounded ${isActive ? 'text-blue-700' : ''}`}>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 2l7 4v6c0 5-3.8 9.8-7 10-3.2-.2-7-5-7-10V6l7-4z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 12h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-sm">Admin</span>
            </NavLink>

            {/* Logout (icon + text) */}
            {userEmail && (
              <button
                onClick={() => {
                  try {
                    clearAuth();
                  } catch {}
                  navigate('/login', { replace: true });
                }}
                className="ml-2 flex items-center gap-2 px-2 py-1 rounded text-red-600 hover:bg-red-50"
                aria-label="Sign out"
                title="Sign out"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M16 17l5-5-5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M21 12H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M9 19H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-sm">Sign out</span>
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* Routed pages */}
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Suspense fallback={<div className="text-sm text-gray-500">Loading…</div>}>
          <Outlet />
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="border-t bg-gray-50">
        <div className="mx-auto max-w-5xl px-4 py-6 text-sm text-gray-500 text-center">
          © {new Date().getFullYear()} Storefront
          {userEmail && (
            <span className="ml-2 text-gray-400">
              • Signed in as <span className="font-medium text-gray-600">{userEmail}</span>
            </span>
          )}
        </div>
      </footer>

      {/* Ask Support panel (available on all routes) */}
      <AssistantPanel />
    </div>
  );
}
