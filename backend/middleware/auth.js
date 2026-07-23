const { verifyToken } = require("../services/token.service");

function requireAuth(req, res, next) {
  const header = req.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const user = verifyToken(token);

  if (!user) {
    return res.status(401).json({ ok: false, error: "Authentication required" });
  }

  req.user = user;
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ ok: false, error: "Admin access required" });
  }

  next();
}

module.exports = {
  requireAdmin,
  requireAuth
};
