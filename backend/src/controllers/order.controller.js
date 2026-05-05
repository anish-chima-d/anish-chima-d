const { asyncHandler } = require("../lib/asyncHandler");
const { createOrder, listOrders, getOrder, cancelOrder, requestReturnForOrder } = require("../services/order.service");

const create = asyncHandler(async (req, res) => {
  const order = await createOrder(req.user.phone, req.body);
  res.status(201).json({ order });
});

const list = asyncHandler(async (req, res) => {
  const orders = await listOrders(req.user.phone);
  res.json({ orders });
});

const getOne = asyncHandler(async (req, res) => {
  const order = await getOrder(req.user.phone, req.params.id);
  res.json({ order });
});

const cancel = asyncHandler(async (req, res) => {
  const order = await cancelOrder(req.user.phone, req.params.id, req.body.reason || "");
  res.json({ order });
});

const requestReturn = asyncHandler(async (req, res) => {
  const order = await requestReturnForOrder(req.user.phone, req.params.id, req.body.reason || "");
  res.json({ order });
});

module.exports = { create, list, getOne, cancel, requestReturn };
