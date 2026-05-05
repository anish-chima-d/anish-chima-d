const { readJson, writeJson } = require("../lib/jsonStore");
const { ApiError } = require("../lib/ApiError");

async function listProductRequests({ phone = "", status = "" } = {}) {
  const requests = await readJson("productRequests.json", []);
  return requests
    .filter(request => !phone || request.phone === phone)
    .filter(request => !status || request.status === status)
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

async function createProductRequest(payload) {
  const required = ["name", "phone", "productName", "quantity", "address"];
  const missing = required.filter(field => !payload?.[field]);
  if (missing.length) throw new ApiError(400, "Missing request fields.", missing);
  if (!/^[0-9]{10}$/.test(String(payload.phone))) throw new ApiError(400, "Phone must be 10 digits.");

  const requests = await readJson("productRequests.json", []);
  const request = {
    id: payload.id || `REQ-${Date.now().toString().slice(-6)}`,
    name: payload.name,
    phone: payload.phone,
    productName: payload.productName,
    category: payload.category || "Other",
    urgency: payload.urgency || "Normal - this week",
    quantity: payload.quantity,
    budget: payload.budget || "",
    address: payload.address,
    notes: payload.notes || "",
    status: payload.status || (String(payload.urgency || "").includes("Emergency") ? "URGENT" : "NEW"),
    createdAt: payload.createdAt || new Date().toISOString()
  };
  requests.push(request);
  await writeJson("productRequests.json", requests);
  return request;
}

module.exports = { listProductRequests, createProductRequest };
