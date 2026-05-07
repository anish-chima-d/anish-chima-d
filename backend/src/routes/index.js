const router = require("express").Router();
const adminRoutes = require("./admin.routes");
const authRoutes = require("./auth.routes");
const cartRoutes = require("./cart.routes");
const couponRoutes = require("./coupon.routes");
const enquiryRoutes = require("./enquiry.routes");
const orderRoutes = require("./order.routes");
const productRoutes = require("./product.routes");
const reviewRoutes = require("./review.routes");
const notificationRoutes = require("./notification.routes");
const searchHistoryRoutes = require("./searchHistory.routes");
const productRequestRoutes = require("./productRequest.routes");
const analyticsRoutes = require("./analytics.routes");
const personalizationRoutes = require("./personalization.routes");
const storefrontRoutes = require("./storefront.routes");
const paymentRoutes = require("./payment.routes");

router.get("/health", (req, res) => {
  res.json({ ok: true, service: "archha-grocery-backend" });
});

router.use("/admin", adminRoutes);
router.use("/auth", authRoutes);
router.use("/cart", cartRoutes);
router.use("/coupons", couponRoutes);
router.use("/enquiries", enquiryRoutes);
router.use("/orders", orderRoutes);
router.use("/products", productRoutes);
router.use("/reviews", reviewRoutes);
router.use("/notifications", notificationRoutes);
router.use("/search-history", searchHistoryRoutes);
router.use("/product-requests", productRequestRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/personalization", personalizationRoutes);
router.use("/storefront", storefrontRoutes);
router.use("/payments", paymentRoutes);

module.exports = router;
