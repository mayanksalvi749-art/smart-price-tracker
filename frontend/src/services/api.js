/**
 * Real-time product API client — all catalog data comes from the ingestion backend + Supabase.
 */
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `API ${res.status}`);
  }
  return res.json();
}

export async function fetchHealth() {
  return request("/api/health");
}

export async function triggerIngestion(queries) {
  return request("/api/ingest/run", {
    method: "POST",
    body: JSON.stringify(queries?.length ? { queries } : {}),
  });
}

export async function syncIngestion(queries) {
  return request("/api/ingest/sync", {
    method: "POST",
    body: JSON.stringify(queries?.length ? { queries } : {}),
  });
}

export async function fetchProductHistory(productId) {
  const data = await request(`/api/products/${productId}/history`);
  return data.items || [];
}

export { API_BASE };
