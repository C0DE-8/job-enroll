const db = require("../db");
const tables = require("../models/tables");
const { insertStatement, makeLimit, makeOffset, updateStatement } = require("./sql-utils");

const companyFields = [
  "name",
  "email",
  "phone",
  "website",
  "logo_url",
  "industry",
  "location",
  "description"
];

async function listCompanies(filters = {}) {
  const params = [];
  const where = [];

  if (filters.search) {
    where.push("(name LIKE ? OR industry LIKE ? OR location LIKE ?)");
    const search = `%${filters.search}%`;
    params.push(search, search, search);
  }

  const limit = makeLimit(filters.limit);
  const offset = makeOffset(filters.offset);
  params.push(limit, offset);

  const sql = [
    `SELECT * FROM \`${tables.companies}\``,
    where.length ? `WHERE ${where.join(" AND ")}` : "",
    "ORDER BY created_at DESC",
    "LIMIT ? OFFSET ?"
  ].filter(Boolean).join(" ");

  return db.query(sql, params);
}

async function getCompany(id) {
  const rows = await db.query(`SELECT * FROM \`${tables.companies}\` WHERE id = ? LIMIT 1`, [id]);
  return rows[0] || null;
}

async function createCompany(data) {
  const statement = insertStatement(tables.companies, data, companyFields);
  return db.execute(statement.sql, statement.params);
}

async function updateCompany(id, data) {
  const statement = updateStatement(tables.companies, id, data, companyFields);
  return db.execute(statement.sql, statement.params);
}

module.exports = {
  createCompany,
  getCompany,
  listCompanies,
  updateCompany
};
