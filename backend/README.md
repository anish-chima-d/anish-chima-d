# Archha Grocery Backend

Node/Express API for the grocery ecommerce website.

## Local usage

1. Run `npm install`
2. Copy `.env.example` to `.env`
3. Run `npm run dev`

## Vercel

The repository root contains `api/index.js` and `vercel.json`, so Vercel serves the Express app at `/api/*` and the HTML storefront from the project root.

Required production environment variables:

- `ADMIN_PIN`: private admin login PIN.
- `SMS_PROVIDER`: `webhook`, `fast2sms`, or `twilio`.
- `SMS_WEBHOOK_URL`: HTTPS endpoint that sends OTP SMS messages when `SMS_PROVIDER=webhook`.
- `SMS_API_KEY`: bearer token for webhook providers or the Fast2SMS API key.
- `SMS_ROUTE`: Fast2SMS route, default `otp`.
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM`: Twilio credentials when `SMS_PROVIDER=twilio`.
- `OTP_TTL_MINUTES`: OTP expiry window, default `10`.
- `OTP_LENGTH`: OTP digit length, default `6`.
- `OTP_MAX_ATTEMPTS`: failed verification limit, default `5`.
- `OTP_RESEND_COOLDOWN_SECONDS`: wait time before another OTP can be requested, default `45`.

OTP endpoints:

- `POST /api/auth/request-otp` with `{ "phone": "9876543210" }`
- `POST /api/auth/verify-otp` with `{ "phone": "9876543210", "otp": "OTP_FROM_SMS" }`

Configure an SMS provider before requesting OTPs. OTP values are never returned to the frontend.
