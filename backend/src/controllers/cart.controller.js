const { asyncHandler } = require("../lib/asyncHandler");
const {
  hydrateCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  clearCart,
  calculateCart
} = require("../services/cart.service");

const getCart = asyncHandler(async (req, res) => {
  const summary = await calculateCart(req.user.phone, req.query.coupon || "");
  res.json(summary);
});

const addItem = asyncHandler(async (req, res) => {
  const items = await addCartItem(req.user.phone, req.body.productId, req.body.quantity || 1);
  res.status(201).json({ items });
});

const updateItem = asyncHandler(async (req, res) => {
  const items = await updateCartItem(req.user.phone, req.params.productId, req.body.quantity);
  res.json({ items });
});

const removeItem = asyncHandler(async (req, res) => {
  const items = await removeCartItem(req.user.phone, req.params.productId);
  res.json({ items });
});

const clear = asyncHandler(async (req, res) => {
  await clearCart(req.user.phone);
  res.json({ items: [] });
});

module.exports = { getCart, addItem, updateItem, removeItem, clear };
