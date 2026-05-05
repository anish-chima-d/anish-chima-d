const { readJson, writeJson } = require("../lib/jsonStore");

async function listNotifications(phone = "") {
  const notifications = await readJson("notifications.json", []);
  return notifications
    .filter(item => !phone || item.phone === phone || !item.phone)
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    .slice(0, 50);
}

async function createNotification(payload) {
  const notifications = await readJson("notifications.json", []);
  const notification = {
    id: payload.id || `NOTE-${Date.now().toString().slice(-6)}`,
    phone: payload.phone || "",
    title: payload.title || "Store update",
    message: payload.message || "",
    type: payload.type || "info",
    read: Boolean(payload.read),
    createdAt: payload.createdAt || new Date().toISOString()
  };
  notifications.push(notification);
  await writeJson("notifications.json", notifications);
  return notification;
}

module.exports = { listNotifications, createNotification };
