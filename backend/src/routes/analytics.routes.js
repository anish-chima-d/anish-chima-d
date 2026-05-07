const router = require("express").Router();
const { createAnalyticsEvents, analyticsSummary } = require("../controllers/analytics.controller");

router.post("/events", createAnalyticsEvents);
router.get("/summary", analyticsSummary);

module.exports = router;
