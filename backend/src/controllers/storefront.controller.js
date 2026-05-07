const { asyncHandler } = require("../lib/asyncHandler");
const { getPersonalizedExperience } = require("../services/personalization.service");
const { env } = require("../config/env");

const getHomeStorefront = asyncHandler(async (req, res) => {
  const experience = await getPersonalizedExperience({});
  res.json({
    architecture: {
      mode: "headless-composable",
      apiBase: "/api",
      frontend: "static-html-js",
      backend: "express-json-api"
    },
    banners: experience.banners,
    offers: experience.offers,
    recommendations: experience.recommendedProducts,
    performance: {
      cdnBaseUrl: env.cdnBaseUrl,
      lazyLoading: true,
      cacheStrategy: "static assets cached for 7 days"
    },
    security: {
      ssl: env.forceHttps ? "enforced" : "platform-terminates-ssl",
      pciDss: "payment data is delegated to secure gateways; no card data is stored locally",
      gateway: env.paymentGateway
    },
    config: {
      googleAnalyticsId: env.googleAnalyticsId,
      heatmapEnabled: env.heatmapEnabled,
      sessionRecordingEnabled: env.sessionRecordingEnabled
    }
  });
});

module.exports = { getHomeStorefront };
