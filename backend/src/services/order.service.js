const crypto = require("crypto");
const { readJson, writeJson } = require("../lib/jsonStore");
const { ApiError } = require("../lib/ApiError");
const { calculateCart, clearCart } = require("./cart.service");

function validateDeliveryAddress(address) {
  const required = ["fullName", "phone", "address", "city", "pincode", "paymentMethod"];
  const missing = required.filter(field => !address?.[field]);
  if (missing.length) throw new ApiError(400, "Missing delivery fields.", missing);
  if (!/^[0-9]{10}$/.test(String(address.phone))) throw new ApiError(400, "Delivery phone must be 10 digits.");
  if (!/^[0-9]{6}$/.test(String(address.pincode))) throw new ApiError(400, "Pincode must be 6 digits.");
}

async function createOrder(phone, payload) {
  const deliveryAddress = payload.deliveryAddress || {};
  validateDeliveryAddress(deliveryAddress);

  const totals = await calculateCart(phone, payload.couponCode || "");
  if (!totals.items.length) throw new ApiError(400, "Cart is empty.");

  const orders = await readJson("orders.json", []);
  const order = {
    id: `ARCHHA-${crypto.randomBytes(3).toString("hex").toUpperCase()}`,
    userPhone: phone,
    status: "PLACED",
    trackingSteps: [
      { label: "Placed", done: true, at: new Date().toISOString() },
      { label: "Packed", done: false },
      { label: "Out for delivery", done: false },
      { label: "Delivered", done: false }
    ],
    returnStatus: "NOT_REQUESTED",
    cancelStatus: "AVAILABLE",
    paymentStatus: "PENDING",
    deliveryAddress,
    items: totals.items,
    subtotal: totals.subtotal,
    discount: totals.discount,
    delivery: totals.delivery,
    total: totals.total,
    couponCode: totals.couponCode,
    createdAt: new Date().toISOString()
  };

  orders.push(order);
  await writeJson("orders.json", orders);
  await clearCart(phone);

  return order;
}

async function listOrders(phone) {
  const orders = await readJson("orders.json", []);
  return orders.filter(order => order.userPhone === phone).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

async function getOrder(phone, orderId) {
  const orders = await listOrders(phone);
  const order = orders.find(item => item.id === orderId);
  if (!order) throw new ApiError(404, "Order not found.");
  return order;
}

async function mutateOrder(phone, orderId, updateFn) {
  const orders = await readJson("orders.json", []);
  const index = orders.findIndex(order => order.userPhone === phone && order.id === orderId);
  if (index < 0) throw new ApiError(404, "Order not found.");
  orders[index] = updateFn(orders[index]);
  orders[index].updatedAt = new Date().toISOString();
  await writeJson("orders.json", orders);
  return orders[index];
}

async function cancelOrder(phone, orderId, reason = "") {
  return mutateOrder(phone, orderId, order => {
    if (["DELIVERED", "CANCELLED"].includes(order.status)) throw new ApiError(400, "This order cannot be cancelled.");
    return {
      ...order,
      status: "CANCELLED",
      cancelStatus: "CANCELLED",
      cancelReason: reason,
      trackingSteps: [
        { label: "Placed", done: true, at: order.createdAt },
        { label: "Cancelled", done: true, at: new Date().toISOString() }
      ]
    };
  });
}

async function requestReturnForOrder(phone, orderId, reason = "") {
  return mutateOrder(phone, orderId, order => ({
    ...order,
    returnStatus: "REQUESTED",
    returnReason: reason,
    trackingSteps: [
      ...(order.trackingSteps || []),
      { label: "Return requested", done: true, at: new Date().toISOString() }
    ]
  }));
}

module.exports = { createOrder, listOrders, getOrder, cancelOrder, requestReturnForOrder };
