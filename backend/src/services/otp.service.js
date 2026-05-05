const crypto = require("crypto");
const { env } = require("../config/env");
const { ApiError } = require("../lib/ApiError");

function validatePhone(phone) {
  if (!/^[0-9]{10}$/.test(String(phone || ""))) {
    throw new ApiError(400, "Enter a valid 10 digit mobile number.");
  }
}

function generateOtp() {
  const length = Math.max(4, Math.min(Number(env.otpLength || 6), 8));
  const min = 10 ** (length - 1);
  const max = 10 ** length;
  return String(crypto.randomInt(min, max));
}

function hashOtp(otp) {
  return crypto.createHash("sha256").update(String(otp)).digest("hex");
}

function assertCanRequestOtp(user) {
  if (!user?.otpRequestedAt) return;

  const lastRequest = new Date(user.otpRequestedAt).getTime();
  const waitMs = env.otpResendCooldownSeconds * 1000;
  if (lastRequest + waitMs > Date.now()) {
    const retryAfter = Math.ceil((lastRequest + waitMs - Date.now()) / 1000);
    throw new ApiError(429, `Please wait ${retryAfter} seconds before requesting another OTP.`);
  }
}

function attachOtp(user, otp) {
  user.otpHash = hashOtp(otp);
  user.otpExpiresAt = new Date(Date.now() + env.otpTtlMinutes * 60 * 1000).toISOString();
  user.otpRequestedAt = new Date().toISOString();
  user.otpAttempts = 0;
  user.updatedAt = new Date().toISOString();
}

function verifyStoredOtp(user, otp) {
  if (!user?.otpHash || !user?.otpExpiresAt) throw new ApiError(401, "Request a new OTP.");
  if (new Date(user.otpExpiresAt).getTime() < Date.now()) throw new ApiError(401, "OTP expired.");

  user.otpAttempts = Number(user.otpAttempts || 0) + 1;
  if (user.otpAttempts > env.otpMaxAttempts) {
    clearOtp(user);
    throw new ApiError(429, "Too many OTP attempts. Request a new OTP.");
  }

  if (hashOtp(otp) !== user.otpHash) throw new ApiError(401, "Invalid OTP.");
  clearOtp(user);
}

function clearOtp(user) {
  delete user.otpHash;
  delete user.otpExpiresAt;
  delete user.otpRequestedAt;
  delete user.otpAttempts;
  user.updatedAt = new Date().toISOString();
}

module.exports = {
  validatePhone,
  generateOtp,
  assertCanRequestOtp,
  attachOtp,
  verifyStoredOtp
};
