const crypto = require("crypto");
const { env } = require("../config/env");
const { readJson, writeJson } = require("../lib/jsonStore");
const { ApiError } = require("../lib/ApiError");

function validatePhone(phone) {
  if (!/^[0-9]{10}$/.test(String(phone || ""))) {
    throw new ApiError(400, "Enter a valid 10 digit mobile number.");
  }
}

async function requestOtp(phone) {
  validatePhone(phone);
  const users = await readJson("users.json", []);
  const existing = users.find(user => user.phone === phone);

  if (!existing) {
    users.push({ phone, createdAt: new Date().toISOString() });
    await writeJson("users.json", users);
  }

  return {
    phone,
    message: "OTP generated. Connect an SMS provider before production.",
    demoOtp: env.nodeEnv === "production" ? undefined : env.demoOtp
  };
}

async function verifyOtp(phone, otp) {
  validatePhone(phone);
  if (String(otp) !== env.demoOtp) throw new ApiError(401, "Invalid OTP.");

  const sessions = await readJson("sessions.json", []);
  const token = crypto.randomBytes(32).toString("hex");
  sessions.push({ phone, token, createdAt: new Date().toISOString() });
  await writeJson("sessions.json", sessions);

  return { phone, token };
}

module.exports = { requestOtp, verifyOtp };
