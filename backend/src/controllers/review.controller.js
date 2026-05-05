const { asyncHandler } = require("../lib/asyncHandler");
const { listReviews, createReview } = require("../services/review.service");

const list = asyncHandler(async (req, res) => {
  const reviews = await listReviews(req.query.productId || "");
  res.json({ reviews });
});

const create = asyncHandler(async (req, res) => {
  const review = await createReview(req.body);
  res.status(201).json({ review });
});

module.exports = { list, create };
