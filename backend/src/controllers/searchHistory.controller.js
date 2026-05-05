const { asyncHandler } = require("../lib/asyncHandler");
const { listSearchHistory, createSearchHistory } = require("../services/searchHistory.service");

const list = asyncHandler(async (req, res) => {
  const history = await listSearchHistory(req.query.phone || "");
  res.json({ history });
});

const create = asyncHandler(async (req, res) => {
  const record = await createSearchHistory(req.body);
  res.status(201).json({ record });
});

module.exports = { list, create };
