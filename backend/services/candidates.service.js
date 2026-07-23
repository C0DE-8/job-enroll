const db = require("../db");
const tables = require("../models/tables");
const { insertStatement, makeLimit, makeOffset, updateStatement } = require("./sql-utils");

const candidateFields = [
  "first_name",
  "last_name",
  "email",
  "phone",
  "title",
  "location",
  "skills",
  "resume_url",
  "photo_url",
  "bio"
];

async function listCandidates(filters = {}) {
  const params = [];
  const where = [];

  if (filters.search) {
    where.push("(first_name LIKE ? OR last_name LIKE ? OR title LIKE ? OR skills LIKE ?)");
    const search = `%${filters.search}%`;
    params.push(search, search, search, search);
  }

  if (filters.location) {
    where.push("location LIKE ?");
    params.push(`%${filters.location}%`);
  }

  const limit = makeLimit(filters.limit);
  const offset = makeOffset(filters.offset);
  params.push(limit, offset);

  const sql = [
    `SELECT * FROM \`${tables.candidates}\``,
    where.length ? `WHERE ${where.join(" AND ")}` : "",
    "ORDER BY created_at DESC",
    "LIMIT ? OFFSET ?"
  ].filter(Boolean).join(" ");

  return db.query(sql, params);
}

async function getCandidate(id) {
  const rows = await db.query(`SELECT * FROM \`${tables.candidates}\` WHERE id = ? LIMIT 1`, [id]);
  return rows[0] || null;
}

async function createCandidate(data) {
  const statement = insertStatement(tables.candidates, data, candidateFields);
  return db.execute(statement.sql, statement.params);
}

async function updateCandidate(id, data) {
  const statement = updateStatement(tables.candidates, id, data, candidateFields);
  return db.execute(statement.sql, statement.params);
}

module.exports = {
  createCandidate,
  getCandidate,
  listCandidates,
  updateCandidate
};
