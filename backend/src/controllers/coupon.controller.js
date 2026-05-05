const { asyncHandler } = require("../lib/asyncHandler");

const validateCoupon = asyncHandler(async (req, res) => {
  const code = String(req.body.code || "").trim().toUpperCase();
  const subtotal = Number(req.body.subtotal || 0);
  const valid = code === "GROCERY10";
  const discount = valid ? Math.round(subtotal * 0.1) : 0;

  res.json({
    valid,
    code: valid ? code : null,
    discount,
    message: valid ? "Coupon applied." : "Invalid coupon."
  });
});

module.exports = { validateCoupon };
