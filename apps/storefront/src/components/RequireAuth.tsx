// apps/storefront/src/components/RequireAuth.tsx
import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getToken, getUser, clearAuth } from "../lib/auth";
import { API } from "../lib/api";

/**
 * Guard that:
 * 1) checks local storage for user+token
 * 2) verifies the token with /api/auth/me
 * 3) only then renders children or redirects to /login
 */
export default function RequireAuth({ children }: { children: React.ReactElement }) {
  const loc = useLocation();
  const [allowed, setAllowed] = useState<null | boolean>(null); // null = loading

  useEffect(() => {
    let alive = true;

    async function verify() {
      const token = getToken();
      const user = getUser();

      // No local auth at all -> straight to login
      if (!token || !user) {
        if (alive) setAllowed(false);
        return;
      }

      // Verify token with API. Use the canonical /api/me route on the server.
      try {
        const url = (API || "") + "/api/me"; // API may be empty for same-origin dev
        const res = await fetch(url, {
          // don't use credentials: 'include' — server expects Authorization header only
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        });

        if (!alive) return;

        if (res.ok) {
          setAllowed(true);
        } else {
          // invalid/expired token
          clearAuth();
          setAllowed(false);
        }
      } catch {
        if (!alive) return;
        clearAuth();
        setAllowed(false);
      }
    }

    verify();
    return () => {
      alive = false;
    };
  }, [loc.pathname]);

  // While verifying, show a tiny placeholder to avoid flashing content
  if (allowed === null) {
    return (
      <div className="p-6 text-sm text-gray-500">
        Checking session…
      </div>
    );
  }

  if (!allowed) {
    return <Navigate to="/login" replace state={{ from: loc }} />;
  }

  return children;
}
