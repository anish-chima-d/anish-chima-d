const { asyncHandler } = require("../lib/asyncHandler");
const { register, requestOtp, verifyOtp, createDemoSession } = require("../services/auth.service");

const registerController = asyncHandler(async (req, res) => {
  const result = await register(req.body);
  res.status(201).json(result);
});

const requestOtpController = asyncHandler(async (req, res) => {
  const result = await requestOtp(req.body.phone);
  res.json(result);
});

const verifyOtpController = asyncHandler(async (req, res) => {
  const result = await verifyOtp(req.body.phone, req.body.otp);
  res.json(result);
});

const demoLoginController = asyncHandler(async (req, res) => {
  const result = await createDemoSession();
  res.status(201).json(result);
});

module.exports = { registerController, requestOtpController, verifyOtpController, demoLoginController };
