import { Link, Outlet } from 'react-router-dom'
import { Suspense } from 'react'
import AssistantPanel from './assistant/panel'
import { useCart } from './lib/store'

export default function App() {
  const total = useCart((s) => s.items.reduce((sum, i) => sum + i.qty, 0))

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3" aria-label="Go to home">
            <img src="/logo.svg" alt="Storefront" className="w-6 h-6" />
            <span className="text-xl font-bold text-blue-600">Storefront</span>
          </Link>

          <nav className="flex items-center gap-4" aria-label="Primary">
            <Link className="hover:underline flex items-center gap-2" to="/">
              {/* Catalog icon */}
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
            </Link>

            <Link
              className="hover:underline flex items-center gap-2"
              to="/cart"
              aria-label={`Cart, ${total} item${total === 1 ? '' : 's'}`}
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
                  <path d="M3 3h2l.4 2M7 13h10l4-8H5.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="10" cy="20" r="1" fill="currentColor" />
                  <circle cx="18" cy="20" r="1" fill="currentColor" />
                </svg>
                {total > 0 && (
                  <span
                    className="absolute -top-1 -right-1 flex items-center justify-center rounded-full bg-red-600 text-white text-[9px] w-3 h-3"
                    aria-hidden="true"
                  >
                    {total}
                  </span>
                )}
              </span>
              <span>Cart</span>
            </Link>
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
        </div>
      </footer>

      {/* Ask Support panel (available on all routes) */}
      <AssistantPanel />
    </div>
  )
}
