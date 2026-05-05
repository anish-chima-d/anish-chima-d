const { readJson, writeJson } = require("../lib/jsonStore");
const { ApiError } = require("../lib/ApiError");
const { getProductById } = require("./product.service");

async function getCartRecord(phone) {
  const carts = await readJson("carts.json", []);
  let cart = carts.find(item => item.phone === phone);
  if (!cart) {
    cart = { phone, items: [] };
    carts.push(cart);
    await writeJson("carts.json", carts);
  }
  return cart;
}

async function saveCartRecord(phone, items) {
  const carts = await readJson("carts.json", []);
  const index = carts.findIndex(item => item.phone === phone);
  const cart = { phone, items };

  if (index >= 0) carts[index] = cart;
  else carts.push(cart);

  await writeJson("carts.json", carts);
  return cart;
}

async function hydrateCart(phone) {
  const cart = await getCartRecord(phone);
  const rows = [];

  for (const item of cart.items) {
    try {
      const product = await getProductById(item.productId);
      rows.push({ ...product, quantity: item.quantity, lineTotal: product.price * item.quantity });
    } catch {
      // Ignore deleted products so old carts do not break the API.
    }
  }

  return rows;
}

async function addCartItem(phone, productId, quantity = 1) {
  await getProductById(productId);
  const cart = await getCartRecord(phone);
  const qty = Math.max(1, Number(quantity) || 1);
  const existing = cart.items.find(item => item.productId === productId);

  if (existing) existing.quantity += qty;
  else cart.items.push({ productId, quantity: qty });

  await saveCartRecord(phone, cart.items);
  return hydrateCart(phone);
}

async function updateCartItem(phone, productId, quantity) {
  await getProductById(productId);
  const qty = Number(quantity);
  if (!Number.isInteger(qty) || qty < 1) throw new ApiError(400, "Quantity must be at least 1.");

  const cart = await getCartRecord(phone);
  const existing = cart.items.find(item => item.productId === productId);
  if (!existing) throw new ApiError(404, "Cart item not found.");

  existing.quantity = qty;
  await saveCartRecord(phone, cart.items);
  return hydrateCart(phone);
}

async function removeCartItem(phone, productId) {
  const cart = await getCartRecord(phone);
  const items = cart.items.filter(item => item.productId !== productId);
  await saveCartRecord(phone, items);
  return hydrateCart(phone);
}

async function clearCart(phone) {
  await saveCartRecord(phone, []);
  return [];
}

async function calculateCart(phone, couponCode = "") {
  const items = await hydrateCart(phone);
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const normalizedCoupon = couponCode.trim().toUpperCase();
  const discount = normalizedCoupon === "GROCERY10" ? Math.round(subtotal * 0.1) : 0;
  const delivery = subtotal === 0 || subtotal >= 499 ? 0 : 49;
  const total = Math.max(subtotal - discount + delivery, 0);

  return { items, subtotal, discount, delivery, total, couponCode: normalizedCoupon || null };
}

module.exports = {
  hydrateCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  clearCart,
  calculateCart
};
