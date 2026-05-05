const { readJson, writeJson } = require("../lib/jsonStore");

async function listSearchHistory(phone = "") {
  const history = await readJson("searchHistory.json", []);
  return history
    .filter(item => !phone || item.phone === phone || !item.phone)
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    .slice(0, 50);
}

async function createSearchHistory(payload) {
  const query = String(payload.query || "").trim();
  if (!query) return null;
  const history = await readJson("searchHistory.json", []);
  const record = {
    id: payload.id || `SEARCH-${Date.now().toString().slice(-6)}`,
    query,
    source: payload.source || "site",
    phone: payload.phone || "",
    createdAt: payload.createdAt || new Date().toISOString()
  };
  history.push(record);
  await writeJson("searchHistory.json", history);
  return record;
}

module.exports = { listSearchHistory, createSearchHistory };
