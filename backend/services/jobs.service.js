const db = require("../db");
const tables = require("../models/tables");
const { insertStatement, makeLimit, makeOffset, updateStatement } = require("./sql-utils");

const jobFields = [
  "title",
  "slug",
  "company_id",
  "company_name",
  "category",
  "category_id",
  "location",
  "job_type",
  "salary",
  "experience",
  "gender",
  "qualification",
  "level",
  "vacancy",
  "description",
  "responsibilities",
  "requirements",
  "education_requirements",
  "working_hours",
  "benefits",
  "statement",
  "status",
  "deadline",
  "expires_at"
];

async function listJobs(filters = {}) {
  const where = [];
  const params = [];

  if (filters.search) {
    where.push("(title LIKE ? OR company_name LIKE ? OR description LIKE ?)");
    const search = `%${filters.search}%`;
    params.push(search, search, search);
  }

  if (filters.location) {
    where.push("location LIKE ?");
    params.push(`%${filters.location}%`);
  }

  if (filters.category) {
    where.push("category = ?");
    params.push(filters.category);
  }

  if (filters.job_type) {
    where.push("job_type = ?");
    params.push(filters.job_type);
  }

  if (filters.status) {
    where.push("status = ?");
    params.push(filters.status);
  }

  const limit = makeLimit(filters.limit);
  const offset = makeOffset(filters.offset);
  params.push(limit, offset);

  const sql = [
    `SELECT * FROM \`${tables.jobs}\``,
    where.length ? `WHERE ${where.join(" AND ")}` : "",
    "ORDER BY created_at DESC",
    "LIMIT ? OFFSET ?"
  ].filter(Boolean).join(" ");

  return db.query(sql, params);
}

async function getJob(id) {
  const rows = await db.query(`SELECT * FROM \`${tables.jobs}\` WHERE id = ? LIMIT 1`, [id]);
  return rows[0] || null;
}

async function createJob(data) {
  const statement = insertStatement(tables.jobs, data, jobFields);
  return db.execute(statement.sql, statement.params);
}

async function updateJob(id, data) {
  const statement = updateStatement(tables.jobs, id, data, jobFields);
  return db.execute(statement.sql, statement.params);
}

async function deleteJob(id) {
  return db.execute(`DELETE FROM \`${tables.jobs}\` WHERE id = ?`, [id]);
}

module.exports = {
  createJob,
  deleteJob,
  getJob,
  listJobs,
  updateJob
};
