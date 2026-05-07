const { asyncHandler } = require("../lib/asyncHandler");
const { getPersonalizedExperience } = require("../services/personalization.service");

const getPersonalization = asyncHandler(async (req, res) => {
  const experience = await getPersonalizedExperience(req.body || {});
  res.json(experience);
});

module.exports = { getPersonalization };
