const { readJson, writeJson } = require("../lib/jsonStore");
const { ApiError } = require("../lib/ApiError");

async function listReviews(productId = "") {
  const reviews = await readJson("reviews.json", []);
  return reviews
    .filter(review => !productId || review.productId === productId)
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

async function createReview(payload) {
  if (!payload?.productId) throw new ApiError(400, "Product ID is required.");
  if (!payload?.name) throw new ApiError(400, "Name is required.");
  const rating = Number(payload.rating);
  if (!rating || rating < 1 || rating > 5) throw new ApiError(400, "Rating must be between 1 and 5.");

  const reviews = await readJson("reviews.json", []);
  const review = {
    id: payload.id || `REVIEW-${Date.now().toString().slice(-6)}`,
    productId: payload.productId,
    name: payload.name,
    title: payload.title || "Customer review",
    rating,
    recommend: payload.recommend || "Not sure",
    pros: payload.pros || "",
    cons: payload.cons || "",
    verified: Boolean(payload.verified),
    helpful: Number(payload.helpful || 0),
    comment: payload.comment || "",
    createdAt: new Date().toISOString()
  };
  reviews.push(review);
  await writeJson("reviews.json", reviews);
  return review;
}

module.exports = { listReviews, createReview };
