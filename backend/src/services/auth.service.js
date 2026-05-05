const crypto = require("crypto");
const { env } = require("../config/env");
const { readJson, writeJson } = require("../lib/jsonStore");
const { sendOtpSms } = require("./sms.service");
const { validatePhone, generateOtp, assertCanRequestOtp, attachOtp, verifyStoredOtp } = require("./otp.service");

async function register(payload = {}) {
  const phone = String(payload.phone || "").trim();
  validatePhone(phone);
  const users = await readJson("users.json", []);
  const existing = users.find(user => user.phone === phone);

  const userProfile = {
    phone,
    fullName: String(payload.fullName || "").trim(),
    city: String(payload.city || "").trim(),
    area: String(payload.area || "").trim()
  };

  if (existing) Object.assign(existing, userProfile, { updatedAt: new Date().toISOString() });
  else users.push({ ...userProfile, createdAt: new Date().toISOString() });

  await writeJson("users.json", users);
  return { user: userProfile };
}

async function requestOtp(phone) {
  validatePhone(phone);
  const users = await readJson("users.json", []);
  let user = users.find(item => item.phone === phone);
  if (!user) {
    user = { phone, createdAt: new Date().toISOString() };
    users.push(user);
  }

  assertCanRequestOtp(user);
  const otp = generateOtp();
  const smsResult = await sendOtpSms(phone, otp);
  attachOtp(user, otp);
  await writeJson("users.json", users);

  return {
    phone,
    message: "OTP sent successfully.",
    provider: smsResult.provider,
    expiresInSeconds: env.otpTtlMinutes * 60
  };
}

async function verifyOtp(phone, otp) {
  validatePhone(phone);
  const users = await readJson("users.json", []);
  const user = users.find(item => item.phone === phone);
  try {
    verifyStoredOtp(user, otp);
  } catch (error) {
    await writeJson("users.json", users);
    throw error;
  }
  await writeJson("users.json", users);

  const sessions = await readJson("sessions.json", []);
  const token = crypto.randomBytes(32).toString("hex");
  sessions.push({ phone, token, createdAt: new Date().toISOString() });
  await writeJson("sessions.json", sessions);

  return { phone, token };
}

module.exports = { register, requestOtp, verifyOtp };
