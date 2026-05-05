const { asyncHandler } = require("../lib/asyncHandler");
const { getProducts, getProductById } = require("../services/product.service");

const listProducts = asyncHandler(async (req, res) => {
  const products = await getProducts({
    search: req.query.search || "",
    category: req.query.category || "all",
    sort: req.query.sort || "featured",
    latitude: req.query.latitude,
    longitude: req.query.longitude
  });
  res.json({ products });
});

const getProduct = asyncHandler(async (req, res) => {
  const product = await getProductById(req.params.id);
  res.json({ product });
});

module.exports = { listProducts, getProduct };
