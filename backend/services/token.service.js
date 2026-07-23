const crypto = require("crypto");

const secret = process.env.APP_SECRET || "career-recruit-dev-secret";

function base64url(input) {
  return Buffer.from(JSON.stringify(input)).toString("base64url");
}

function sign(value) {
  return crypto.createHmac("sha256", secret).update(value).digest("base64url");
}

function createToken(user) {
  const header = base64url({ alg: "HS256", typ: "JWT" });
  const payload = base64url({
    id: user.id,
    email: user.email,
    role: user.role,
    is_verified: Boolean(user.is_verified),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24
  });
  const signature = sign(`${header}.${payload}`);

  return `${header}.${payload}.${signature}`;
}

function verifyToken(token) {
  const [header, payload, signature] = String(token || "").split(".");

  if (!header || !payload || !signature) {
    return null;
  }

  const expected = sign(`${header}.${payload}`);
  if (signature.length !== expected.length) {
    return null;
  }

  const isValid = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));

  if (!isValid) {
    return null;
  }

  const user = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));

  if (user.exp && user.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }

  return user;
}

module.exports = {
  createToken,
  verifyToken
};
