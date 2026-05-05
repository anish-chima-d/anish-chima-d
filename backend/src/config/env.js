require("dotenv").config();

const env = {
  port: Number(process.env.PORT || 5000),
  nodeEnv: process.env.NODE_ENV || "development",
  clientOrigin: process.env.CLIENT_ORIGIN || "*",
  demoOtp: process.env.DEMO_OTP || "123456",
  adminPin: process.env.ADMIN_PIN || "9999"
};

module.exports = { env };
