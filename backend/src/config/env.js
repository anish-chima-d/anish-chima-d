require("dotenv").config();

const env = {
  port: Number(process.env.PORT || 5000),
  nodeEnv: process.env.NODE_ENV || "development",
  clientOrigin: process.env.CLIENT_ORIGIN || "*",
  adminPin: process.env.ADMIN_PIN || "",
  smsProvider: process.env.SMS_PROVIDER || "webhook",
  smsWebhookUrl: process.env.SMS_WEBHOOK_URL || "",
  smsApiKey: process.env.SMS_API_KEY || "",
  smsFrom: process.env.SMS_FROM || "",
  smsRoute: process.env.SMS_ROUTE || "otp",
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || "",
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || "",
  twilioFrom: process.env.TWILIO_FROM || "",
  otpTtlMinutes: Number(process.env.OTP_TTL_MINUTES || 10),
  otpLength: Number(process.env.OTP_LENGTH || 6),
  otpMaxAttempts: Number(process.env.OTP_MAX_ATTEMPTS || 5),
  otpResendCooldownSeconds: Number(process.env.OTP_RESEND_COOLDOWN_SECONDS || 45)
};

module.exports = { env };
