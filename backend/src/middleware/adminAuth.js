const { readJson } = require("../lib/jsonStore");
const { ApiError } = require("../lib/ApiError");

async function requireAdmin(req, res, next) {
  if (process.env.ADMIN_LOGIN_DISABLED !== "false") {
    req.admin = { role: "admin", bypass: true };
    next();
    return;
  }

  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (!token) throw new ApiError(401, "Admin login required.");

    const sessions = await readJson("adminSessions.json", []);
    const session = sessions.find(item => item.token === token);
    if (!session) throw new ApiError(401, "Invalid admin session.");

    req.admin = { role: "admin" };
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = { requireAdmin };
