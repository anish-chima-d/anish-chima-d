const { readJson, writeJson } = require("../lib/jsonStore");

const MAX_EVENTS = 1000;

function safeText(value, fallback = "") {
  return String(value ?? fallback).trim().slice(0, 160);
}

function normalizeEvent(event = {}, req) {
  return {
    id: `EVT-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    type: safeText(event.type, "event"),
    sessionId: safeText(event.sessionId, "anonymous"),
    page: safeText(event.page || req.headers.referer || "/"),
    path: safeText(event.path || ""),
    productId: safeText(event.productId || ""),
    step: safeText(event.step || ""),
    value: Number(event.value || 0),
    meta: typeof event.meta === "object" && event.meta !== null ? event.meta : {},
    userAgent: safeText(req.headers["user-agent"] || ""),
    createdAt: new Date().toISOString()
  };
}

async function recordEvents(events, req) {
  const incoming = Array.isArray(events) ? events : [events];
  const current = await readJson("analyticsEvents.json", []);
  const normalized = incoming.map(event => normalizeEvent(event, req));
  await writeJson("analyticsEvents.json", [...normalized, ...current].slice(0, MAX_EVENTS));
  return normalized;
}

async function getAnalyticsSummary() {
  const events = await readJson("analyticsEvents.json", []);
  const byType = events.reduce((summary, event) => {
    summary[event.type] = (summary[event.type] || 0) + 1;
    return summary;
  }, {});
  const heatmap = events
    .filter(event => event.type === "heatmap_click")
    .slice(0, 100)
    .map(event => ({
      page: event.page,
      x: event.meta?.x,
      y: event.meta?.y,
      target: event.meta?.target,
      createdAt: event.createdAt
    }));

  return {
    totalEvents: events.length,
    byType,
    addToCart: byType.add_to_cart || 0,
    checkoutSteps: Object.fromEntries(
      events
        .filter(event => event.type === "checkout_step")
        .reduce((map, event) => map.set(event.step, (map.get(event.step) || 0) + 1), new Map())
    ),
    heatmap
  };
}

module.exports = { recordEvents, getAnalyticsSummary };
