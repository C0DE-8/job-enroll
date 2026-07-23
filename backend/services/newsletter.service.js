const db = require("../db");
const tables = require("../models/tables");
const { makeLimit, makeOffset } = require("./sql-utils");

async function subscribe(data) {
  if (!data.email) {
    const error = new Error("Email is required");
    error.statusCode = 400;
    throw error;
  }

  return db.execute(
    `INSERT INTO \`${tables.newsletterSubscribers}\` (email, status) VALUES (?, ?) ON DUPLICATE KEY UPDATE status = VALUES(status), updated_at = CURRENT_TIMESTAMP`,
    [String(data.email).trim().toLowerCase(), data.status || "active"]
  );
}

async function listSubscribers(filters = {}) {
  const where = [];
  const params = [];

  if (filters.status) {
    where.push("status = ?");
    params.push(filters.status);
  }

  if (filters.search) {
    where.push("email LIKE ?");
    params.push(`%${filters.search}%`);
  }

  const limit = makeLimit(filters.limit, 100, 200);
  const offset = makeOffset(filters.offset);
  params.push(limit, offset);

  const sql = [
    `SELECT * FROM \`${tables.newsletterSubscribers}\``,
    where.length ? `WHERE ${where.join(" AND ")}` : "",
    "ORDER BY created_at DESC",
    "LIMIT ? OFFSET ?"
  ].filter(Boolean).join(" ");

  return db.query(sql, params);
}

async function deleteSubscriber(id) {
  return db.execute(`DELETE FROM \`${tables.newsletterSubscribers}\` WHERE id = ?`, [id]);
}

module.exports = {
  deleteSubscriber,
  listSubscribers,
  subscribe
};
