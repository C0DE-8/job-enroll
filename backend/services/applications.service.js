const db = require("../db");
const tables = require("../models/tables");
const { insertStatement, makeLimit, makeOffset, updateStatement } = require("./sql-utils");

const applicationFields = [
  "job_id",
  "candidate_id",
  "name",
  "email",
  "phone",
  "resume_url",
  "cover_letter",
  "status"
];

async function listApplications(filters = {}) {
  const where = [];
  const params = [];

  if (filters.job_id) {
    where.push("job_id = ?");
    params.push(filters.job_id);
  }

  if (filters.candidate_id) {
    where.push("candidate_id = ?");
    params.push(filters.candidate_id);
  }

  if (filters.status) {
    where.push("status = ?");
    params.push(filters.status);
  }

  const limit = makeLimit(filters.limit);
  const offset = makeOffset(filters.offset);
  params.push(limit, offset);

  const sql = [
    `SELECT * FROM \`${tables.applications}\``,
    where.length ? `WHERE ${where.join(" AND ")}` : "",
    "ORDER BY created_at DESC",
    "LIMIT ? OFFSET ?"
  ].filter(Boolean).join(" ");

  return db.query(sql, params);
}

async function createApplication(data) {
  const statement = insertStatement(tables.applications, data, applicationFields);
  return db.execute(statement.sql, statement.params);
}

async function updateApplication(id, data) {
  const statement = updateStatement(tables.applications, id, data, ["status"]);
  return db.execute(statement.sql, statement.params);
}

module.exports = {
  createApplication,
  listApplications,
  updateApplication
};
