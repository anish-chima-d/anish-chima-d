const { asyncHandler } = require("../lib/asyncHandler");
const { listProductRequests, createProductRequest } = require("../services/productRequest.service");

const list = asyncHandler(async (req, res) => {
  const requests = await listProductRequests({
    phone: req.query.phone || "",
    status: req.query.status || ""
  });
  res.json({ requests });
});

const create = asyncHandler(async (req, res) => {
  const request = await createProductRequest(req.body);
  res.status(201).json({ request });
});

module.exports = { list, create };
