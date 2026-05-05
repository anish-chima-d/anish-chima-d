const crypto = require("crypto");
const { readJson, writeJson } = require("../lib/jsonStore");
const { ApiError } = require("../lib/ApiError");

function validateEnquiry(payload) {
  if (!payload?.name) throw new ApiError(400, "Name is required.");
  if (!/^[0-9]{10}$/.test(String(payload.phone || ""))) {
    throw new ApiError(400, "Phone must be a valid 10 digit mobile number.");
  }
}

async function createEnquiry(payload) {
  validateEnquiry(payload);
  const enquiries = await readJson("enquiries.json", []);
  const enquiry = {
    id: `ENQ-${crypto.randomBytes(3).toString("hex").toUpperCase()}`,
    name: payload.name,
    phone: payload.phone,
    city: payload.city || "",
    need: payload.need || "General enquiry",
    message: payload.message || "",
    createdAt: new Date().toISOString()
  };

  enquiries.push(enquiry);
  await writeJson("enquiries.json", enquiries);
  return enquiry;
}

async function listEnquiries() {
  const enquiries = await readJson("enquiries.json", []);
  return enquiries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

module.exports = { createEnquiry, listEnquiries };
