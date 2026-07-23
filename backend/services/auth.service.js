const crypto = require("crypto");
const db = require("../db");
const tables = require("../models/tables");
const { createToken } = require("./token.service");
const { insertStatement } = require("./sql-utils");

const userFields = [
  "email",
  "password_hash",
  "role",
  "is_verified",
  "verification_status",
  "payment_status",
  "payment_reference",
  "employer_fee_amount"
];

function hashPassword(password) {
  return crypto.createHash("sha256").update(String(password)).digest("hex");
}

async function register(data) {
  if (!data.email || !data.password) {
    const error = new Error("Email and password are required");
    error.statusCode = 400;
    throw error;
  }

  const role = data.role === "employer" ? "employer" : "candidate";
  const isEmployer = role === "employer";
  const statement = insertStatement(tables.users, {
    email: data.email,
    password_hash: hashPassword(data.password),
    role,
    is_verified: isEmployer ? 0 : 1,
    verification_status: isEmployer ? "pending" : "verified",
    payment_status: isEmployer ? "pending" : "not_required",
    payment_reference: data.payment_reference,
    employer_fee_amount: data.employer_fee_amount
  }, userFields);

  await db.execute(statement.sql, statement.params);

  const rows = await db.query(
    `SELECT id, email, role, is_verified, verification_status, payment_status, created_at FROM \`${tables.users}\` WHERE email = ? LIMIT 1`,
    [data.email]
  );

  return rows[0] || null;
}

async function login(data) {
  if (!data.email || !data.password) {
    const error = new Error("Email and password are required");
    error.statusCode = 400;
    throw error;
  }

  const rows = await db.query(
    `SELECT id, email, role, is_verified, verification_status, payment_status, created_at FROM \`${tables.users}\` WHERE email = ? AND password_hash = ? LIMIT 1`,
    [data.email, hashPassword(data.password)]
  );

  if (!rows[0]) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  const user = rows[0];

  return {
    token: createToken(user),
    user
  };
}

module.exports = {
  hashPassword,
  login,
  register
};
