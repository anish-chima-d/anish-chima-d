const { asyncHandler } = require("../lib/asyncHandler");
const { listNotifications, createNotification } = require("../services/notification.service");

const list = asyncHandler(async (req, res) => {
  const notifications = await listNotifications(req.query.phone || "");
  res.json({ notifications });
});

const create = asyncHandler(async (req, res) => {
  const notification = await createNotification(req.body);
  res.status(201).json({ notification });
});

module.exports = { list, create };
