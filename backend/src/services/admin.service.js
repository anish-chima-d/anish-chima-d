const crypto = require("crypto");
const { env } = require("../config/env");
const { readJson, writeJson } = require("../lib/jsonStore");
const { ApiError } = require("../lib/ApiError");

function makeId(name) {
  return String(name || "product")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 42) || `product-${Date.now()}`;
}

function optionalNumber(value) {
  if (value === undefined || value === null || value === "") return "";
  const number = Number(value);
  return Number.isFinite(number) ? number : "";
}

async function login(pin) {
  if (!env.adminPin) throw new ApiError(500, "Admin PIN is not configured.");
  if (String(pin) !== env.adminPin) throw new ApiError(401, "Invalid admin PIN.");

  const sessions = await readJson("adminSessions.json", []);
  const token = crypto.randomBytes(32).toString("hex");
  sessions.push({ token, createdAt: new Date().toISOString() });
  await writeJson("adminSessions.json", sessions);
  return { token };
}

async function dashboard() {
  const products = await readJson("products.json", []);
  const orders = await readJson("orders.json", []);
  const enquiries = await readJson("enquiries.json", []);
  const revenue = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);

  return {
    products: products.length,
    orders: orders.length,
    enquiries: enquiries.length,
    revenue
  };
}

async function listProducts() {
  return readJson("products.json", []);
}

async function createProduct(payload) {
  if (!payload?.name) throw new ApiError(400, "Product name is required.");
  if (!Number(payload.price)) throw new ApiError(400, "Product price is required.");

  const products = await readJson("products.json", []);
  const id = payload.id || makeId(payload.name);
  if (products.some(product => product.id === id)) throw new ApiError(409, "Product ID already exists.");

  const product = {
    id,
    name: payload.name,
    fragrance: payload.fragrance || "",
    sub: payload.sub || "",
    price: Number(payload.price),
    type: payload.type || "produce",
    tag: payload.tag || "New",
    icon: payload.icon || payload.name.charAt(0).toUpperCase(),
    rating: payload.rating || "4.5",
    burnTime: payload.burnTime || "30 minutes",
    pack: payload.pack || "Standard pack",
    use: payload.use || "Daily cooking and family restock",
    description: payload.description || payload.sub || "Product description",
    shopName: payload.shopName || "Archha partner shop",
    shopLatitude: optionalNumber(payload.shopLatitude),
    shopLongitude: optionalNumber(payload.shopLongitude)
  };

  products.push(product);
  await writeJson("products.json", products);
  return product;
}

async function updateProduct(productId, payload) {
  const products = await readJson("products.json", []);
  const index = products.findIndex(product => product.id === productId);
  if (index < 0) throw new ApiError(404, "Product not found.");

  products[index] = {
    ...products[index],
    ...payload,
    id: productId,
    price: payload.price === undefined ? products[index].price : Number(payload.price),
    shopLatitude: optionalNumber(payload.shopLatitude),
    shopLongitude: optionalNumber(payload.shopLongitude)
  };
  await writeJson("products.json", products);
  return products[index];
}

async function deleteProduct(productId) {
  const products = await readJson("products.json", []);
  const nextProducts = products.filter(product => product.id !== productId);
  if (nextProducts.length === products.length) throw new ApiError(404, "Product not found.");
  await writeJson("products.json", nextProducts);
  return { deleted: true };
}

async function listOrders() {
  const orders = await readJson("orders.json", []);
  return orders.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

async function updateOrderStatus(orderId, status) {
  const allowed = ["PLACED", "PACKED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];
  if (!allowed.includes(status)) throw new ApiError(400, "Invalid order status.");

  const orders = await readJson("orders.json", []);
  const order = orders.find(item => item.id === orderId);
  if (!order) throw new ApiError(404, "Order not found.");

  order.status = status;
  order.updatedAt = new Date().toISOString();
  await writeJson("orders.json", orders);
  return order;
}

async function listEnquiries() {
  const enquiries = await readJson("enquiries.json", []);
  return enquiries.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

async function updateEnquiryStatus(enquiryId, status) {
  const allowed = ["NEW", "CONTACTED", "CLOSED"];
  if (!allowed.includes(status)) throw new ApiError(400, "Invalid enquiry status.");

  const enquiries = await readJson("enquiries.json", []);
  const enquiry = enquiries.find(item => item.id === enquiryId);
  if (!enquiry) throw new ApiError(404, "Enquiry not found.");

  enquiry.status = status;
  enquiry.updatedAt = new Date().toISOString();
  await writeJson("enquiries.json", enquiries);
  return enquiry;
}

module.exports = {
  login,
  dashboard,
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  listOrders,
  updateOrderStatus,
  listEnquiries,
  updateEnquiryStatus
};
