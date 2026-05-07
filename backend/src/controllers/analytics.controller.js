const { asyncHandler } = require("../lib/asyncHandler");
const { recordEvents, getAnalyticsSummary } = require("../services/analytics.service");

const createAnalyticsEvents = asyncHandler(async (req, res) => {
  const events = await recordEvents(req.body.events || req.body, req);
  res.status(201).json({ ok: true, eventsAccepted: events.length });
});

const analyticsSummary = asyncHandler(async (req, res) => {
  const summary = await getAnalyticsSummary();
  res.json({ summary });
});

module.exports = { createAnalyticsEvents, analyticsSummary };
