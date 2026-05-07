const { asyncHandler } = require("../lib/asyncHandler");
const { env } = require("../config/env");

const listPaymentMethods = asyncHandler(async (req, res) => {
  res.json({
    gateway: env.paymentGateway,
    pciDss: "Card and UPI processing should be completed through a PCI DSS compliant payment gateway.",
    sslRequired: true,
    methods: [
      { id: "cod", label: "Cash on delivery", secure: true },
      { id: "upi", label: "UPI / QR", secure: true },
      { id: "card", label: "Credit / debit card via secure gateway", secure: true },
      { id: "wallet", label: "Wallet / net banking", secure: true }
    ]
  });
});

module.exports = { listPaymentMethods };
