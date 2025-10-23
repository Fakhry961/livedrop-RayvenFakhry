// apps/storefront/src/lib/auth.ts
export function getToken(): string | null {
  try {
    const t = localStorage.getItem("storefront-token");
    return t && t.trim().length > 0 ? t : null;
  } catch {
    return null;
  }
}

export function getUser<T = any>(): T | null {
  try {
    const raw = localStorage.getItem("storefront-user");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Require at least an _id or email to be considered “real” user
    if (parsed && typeof parsed === "object" && (parsed._id || parsed.email)) {
      return parsed as T;
    }
    return null;
  } catch {
    return null;
  }
}

export function setAuth(user: unknown, token?: string) {
  try {
    localStorage.setItem("storefront-user", JSON.stringify(user ?? null));
    if (token) localStorage.setItem("storefront-token", token);
  } catch {}
}

export function clearAuth() {
  try {
    localStorage.removeItem("storefront-user");
    localStorage.removeItem("storefront-token");
  } catch {}
}
