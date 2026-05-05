const { env } = require("../config/env");
const { ApiError } = require("../lib/ApiError");

function otpMessage(otp) {
  return `Your Archha Grocery OTP is ${otp}. It expires in ${env.otpTtlMinutes} minutes.`;
}

async function sendWebhookSms(phone, otp) {
  if (!env.smsWebhookUrl) throw new ApiError(503, "SMS webhook is not configured.");

  const response = await fetch(env.smsWebhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(env.smsApiKey ? { Authorization: `Bearer ${env.smsApiKey}` } : {})
    },
    body: JSON.stringify({
      phone,
      otp,
      message: otpMessage(otp)
    })
  });

  if (!response.ok) throw new ApiError(502, "SMS webhook rejected the OTP request.");
  return { provider: "webhook" };
}

async function sendFast2Sms(phone, otp) {
  if (!env.smsApiKey) throw new ApiError(503, "Fast2SMS API key is not configured.");

  const payload = new URLSearchParams({
    route: env.smsRoute,
    variables_values: otp,
    numbers: phone
  });

  const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
    method: "POST",
    headers: {
      authorization: env.smsApiKey,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json"
    },
    body: payload
  });

  const result = await response.json().catch(async () => ({ message: await response.text().catch(() => "") }));
  if (response.ok && result.return !== false) {
    return { provider: "fast2sms", requestId: result.request_id };
  }

  const query = new URLSearchParams({
    authorization: env.smsApiKey,
    route: env.smsRoute,
    variables_values: otp,
    numbers: phone
  });
  const getResponse = await fetch(`https://www.fast2sms.com/dev/bulkV2?${query.toString()}`, {
    method: "GET",
    headers: { Accept: "application/json" }
  });
  const getResult = await getResponse.json().catch(async () => ({ message: await getResponse.text().catch(() => "") }));
  if (getResponse.ok && getResult.return !== false) {
    return { provider: "fast2sms", requestId: getResult.request_id };
  }

  const message = Array.isArray(result.message) ? result.message.join(" ") : result.message;
  const getMessage = Array.isArray(getResult.message) ? getResult.message.join(" ") : getResult.message;

  const reason = getMessage || message || "Fast2SMS rejected the OTP request.";
  console.error("Fast2SMS OTP failed:", {
    postStatus: response.status,
    getStatus: getResponse.status,
    reason,
    postResult: result,
    getResult
  });
  throw new ApiError(502, `Fast2SMS: ${reason}`, {
    provider: "fast2sms",
    postStatus: response.status,
    getStatus: getResponse.status,
    postResult: result,
    getResult
  });
}

async function sendTwilioSms(phone, otp) {
  if (!env.twilioAccountSid || !env.twilioAuthToken || !env.twilioFrom) {
    throw new ApiError(503, "Twilio credentials are not configured.");
  }

  const credentials = Buffer.from(`${env.twilioAccountSid}:${env.twilioAuthToken}`).toString("base64");
  const body = new URLSearchParams({
    From: env.twilioFrom,
    To: phone.startsWith("+") ? phone : `+91${phone}`,
    Body: otpMessage(otp)
  });

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${env.twilioAccountSid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });

  if (!response.ok) throw new ApiError(502, "Twilio rejected the OTP request.");
  return { provider: "twilio" };
}

async function sendOtpSms(phone, otp) {
  if (env.smsProvider === "fast2sms") return sendFast2Sms(phone, otp);
  if (env.smsProvider === "twilio") return sendTwilioSms(phone, otp);
  return sendWebhookSms(phone, otp);
}

module.exports = { sendOtpSms };
