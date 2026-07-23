const crypto = require("crypto");
const db = require("../db");
const tables = require("../models/tables");
const { insertStatement } = require("./sql-utils");

const userFields = ["email", "password_hash", "role"];

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
  const statement = insertStatement(tables.users, {
    email: data.email,
    password_hash: hashPassword(data.password),
    role
  }, userFields);

  return db.execute(statement.sql, statement.params);
}

async function login(data) {
  if (!data.email || !data.password) {
    const error = new Error("Email and password are required");
    error.statusCode = 400;
    throw error;
  }

  const rows = await db.query(
    `SELECT id, email, role, created_at FROM \`${tables.users}\` WHERE email = ? AND password_hash = ? LIMIT 1`,
    [data.email, hashPassword(data.password)]
  );

  if (!rows[0]) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  return rows[0];
}

module.exports = {
  login,
  register
};
