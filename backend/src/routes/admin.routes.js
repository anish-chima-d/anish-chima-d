const router = require("express").Router();
const { requireAdmin } = require("../middleware/adminAuth");
const admin = require("../controllers/admin.controller");

router.post("/login", admin.login);

router.use(requireAdmin);
router.get("/dashboard", admin.dashboard);
router.get("/products", admin.listProducts);
router.post("/products", admin.createProduct);
router.patch("/products/:id", admin.updateProduct);
router.delete("/products/:id", admin.deleteProduct);
router.get("/orders", admin.listOrders);
router.patch("/orders/:id/status", admin.updateOrderStatus);
router.get("/enquiries", admin.listEnquiries);
router.patch("/enquiries/:id/status", admin.updateEnquiryStatus);

module.exports = router;
