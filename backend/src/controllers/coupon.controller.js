const { asyncHandler } = require("../lib/asyncHandler");

const validateCoupon = asyncHandler(async (req, res) => {
  const code = String(req.body.code || "").trim().toUpperCase();

  res.json({
    valid: false,
    code: null,
    discount: 0,
    message: code ? "No coupon is active." : "Enter a coupon code."
  });
});

module.exports = { validateCoupon };
