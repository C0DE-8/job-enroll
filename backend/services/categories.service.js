const db = require("../db");
const tables = require("../models/tables");
const { insertStatement, makeLimit, makeOffset, updateStatement } = require("./sql-utils");

const categoryFields = [
  "name",
  "slug",
  "icon_class",
  "description",
  "job_count",
  "sort_order",
  "status"
];

async function listCategories(filters = {}) {
  const where = [];
  const params = [];

  if (filters.status) {
    where.push("status = ?");
    params.push(filters.status);
  }

  if (filters.search) {
    where.push("(name LIKE ? OR description LIKE ?)");
    const search = `%${filters.search}%`;
    params.push(search, search);
  }

  const limit = makeLimit(filters.limit, 100, 200);
  const offset = makeOffset(filters.offset);
  params.push(limit, offset);

  const sql = [
    `SELECT * FROM \`${tables.categories}\``,
    where.length ? `WHERE ${where.join(" AND ")}` : "",
    "ORDER BY sort_order ASC, name ASC",
    "LIMIT ? OFFSET ?"
  ].filter(Boolean).join(" ");

  return db.query(sql, params);
}

async function getCategory(id) {
  const rows = await db.query(`SELECT * FROM \`${tables.categories}\` WHERE id = ? LIMIT 1`, [id]);
  return rows[0] || null;
}

async function createCategory(data) {
  const statement = insertStatement(tables.categories, data, categoryFields);
  return db.execute(statement.sql, statement.params);
}

async function updateCategory(id, data) {
  const statement = updateStatement(tables.categories, id, data, categoryFields);
  return db.execute(statement.sql, statement.params);
}

async function deleteCategory(id) {
  return db.execute(`DELETE FROM \`${tables.categories}\` WHERE id = ?`, [id]);
}

module.exports = {
  createCategory,
  deleteCategory,
  getCategory,
  listCategories,
  updateCategory
};
