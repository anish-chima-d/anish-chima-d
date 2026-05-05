const { asyncHandler } = require("../lib/asyncHandler");
const adminService = require("../services/admin.service");

const login = asyncHandler(async (req, res) => {
  const result = await adminService.login(req.body.pin);
  res.json(result);
});

const dashboard = asyncHandler(async (req, res) => {
  res.json({ dashboard: await adminService.dashboard() });
});

const listProducts = asyncHandler(async (req, res) => {
  res.json({ products: await adminService.listProducts() });
});

const createProduct = asyncHandler(async (req, res) => {
  res.status(201).json({ product: await adminService.createProduct(req.body) });
});

const updateProduct = asyncHandler(async (req, res) => {
  res.json({ product: await adminService.updateProduct(req.params.id, req.body) });
});

const deleteProduct = asyncHandler(async (req, res) => {
  res.json(await adminService.deleteProduct(req.params.id));
});

const listOrders = asyncHandler(async (req, res) => {
  res.json({ orders: await adminService.listOrders() });
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  res.json({ order: await adminService.updateOrderStatus(req.params.id, req.body.status) });
});

const listEnquiries = asyncHandler(async (req, res) => {
  res.json({ enquiries: await adminService.listEnquiries() });
});

const updateEnquiryStatus = asyncHandler(async (req, res) => {
  res.json({ enquiry: await adminService.updateEnquiryStatus(req.params.id, req.body.status) });
});

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
