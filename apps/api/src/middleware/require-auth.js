// apps/api/src/middleware/require-auth.js
import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  try {
    const hdr = String(req.headers.authorization || "");
    const [, token] = hdr.split(" ");
    if (!token) return res.status(401).json({ error: { code: 401, message: "Unauthorized" }});

    const secret = process.env.JWT_SECRET || "dev-secret-change-me";
    const payload = jwt.verify(token, secret);
    req.user = { id: payload.sub, email: payload.email || null };
    return next();
  } catch (e) {
    return res.status(401).json({ error: { code: 401, message: "Unauthorized" }});
  }
}
