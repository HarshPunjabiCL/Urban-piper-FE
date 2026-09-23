const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5100";

const parseJson = async (response) => {
  const text = await response.text();
  return text ? JSON.parse(text) : null;
};

const request = async (path, options = {}) => {
  const response = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    cache: "no-store"
  });

  const payload = await parseJson(response);

  if (!response.ok) {
    // The backend forwards UrbanPiper's own error body under `upstream` — surface
    // it, because that is where the real reason lives.
    const message = payload?.error || `Request failed with HTTP ${response.status}`;
    const error = new Error(message);
    error.upstream = payload?.upstream || null;
    error.allowed = payload?.allowed || payload?.allowedFromHere || null;
    // Local schema validation: field-level problems caught before the call left.
    error.validation = payload?.validation || null;
    error.dropped = payload?.dropped || null;
    throw error;
  }

  return payload;
};

// ---- Health / meta ----
export const getHealth = () => request("/health");
export const getReasonCodes = () => request("/api/meta/reason-codes");

// ---- Orders ----
export const listOrders = () => request("/api/orders");

export const acceptOrder = (id, prepTimeMins) =>
  request(`/api/orders/${encodeURIComponent(id)}/accept`, {
    method: "POST",
    body: JSON.stringify({ prepTimeMins })
  });

export const rejectOrder = (id, reasonCode, message) =>
  request(`/api/orders/${encodeURIComponent(id)}/reject`, {
    method: "POST",
    body: JSON.stringify({ reasonCode, message })
  });

export const advanceOrder = (id, newStatus) =>
  request(`/api/orders/${encodeURIComponent(id)}/status`, {
    method: "POST",
    body: JSON.stringify({ newStatus })
  });

// ---- Setup ----
export const registerStore = (body) =>
  request("/api/stores", { method: "POST", body: JSON.stringify(body) });

export const pushMenu = (locationRefId, menu) =>
  request(`/api/menu/${encodeURIComponent(locationRefId)}`, {
    method: "POST",
    body: JSON.stringify(menu)
  });

/**
 * Outlets we have registered before, with the payload last sent for each.
 * UrbanPiper publishes no GET for stores, so this comes from our own job log.
 */
export const listKnownStores = () => request("/api/stores");

/** What UrbanPiper can carry, and the documented list of what it cannot. */
export const getSchema = () => request("/api/schema");

/** §8: preview how a POS variant set becomes an option group + options. */
export const previewVariant = (body) =>
  request("/api/menu/variant-preview", { method: "POST", body: JSON.stringify(body) });

/** §4 / §12 availability. action: enable | disable | publish | ... */
export const runStoreAction = (body) =>
  request("/api/stores/action", { method: "POST", body: JSON.stringify(body) });

export const runItemAction = (body) =>
  request("/api/items/action", { method: "POST", body: JSON.stringify(body) });

/** §13: the only scheduling level below the outlet. */
export const setCategoryTimings = (timingGroups) =>
  request("/api/menu/timing-groups", {
    method: "POST",
    body: JSON.stringify({ timing_groups: timingGroups })
  });

export const listWebhooks = () => request("/api/webhooks");

/** Repoint an existing registration — POST would create a duplicate. */
export const updateWebhook = (id, eventType, url, active = true) =>
  request(`/api/webhooks/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify({ eventType, url, active })
  });

export const createWebhook = (eventType, url) =>
  request("/api/webhooks", { method: "POST", body: JSON.stringify({ eventType, url }) });

export const getWebhookLog = () => request("/api/webhooks/log");
export const getJobs = () => request("/api/jobs");
