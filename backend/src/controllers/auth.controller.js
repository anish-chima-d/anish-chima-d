const { asyncHandler } = require("../lib/asyncHandler");
const { requestOtp, verifyOtp } = require("../services/auth.service");

const requestOtpController = asyncHandler(async (req, res) => {
  const result = await requestOtp(req.body.phone);
  res.json(result);
});

const verifyOtpController = asyncHandler(async (req, res) => {
  const result = await verifyOtp(req.body.phone, req.body.otp);
  res.json(result);
});

module.exports = { requestOtpController, verifyOtpController };
