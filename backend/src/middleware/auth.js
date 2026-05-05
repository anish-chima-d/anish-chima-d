const { readJson } = require("../lib/jsonStore");
const { ApiError } = require("../lib/ApiError");

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (!token) throw new ApiError(401, "Login required.");

    const sessions = await readJson("sessions.json", []);
    const session = sessions.find(item => item.token === token);
    if (!session) throw new ApiError(401, "Invalid or expired session.");

    req.user = { phone: session.phone };
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = { requireAuth };
