const db = require("../db");
const tables = require("../models/tables");
const { insertStatement, makeLimit, makeOffset, updateStatement } = require("./sql-utils");

const testimonialFields = [
  "client_name",
  "slug",
  "designation",
  "company",
  "photo_url",
  "message",
  "rating",
  "status",
  "sort_order"
];

async function listTestimonials(filters = {}) {
  const params = [];
  const where = [];

  if (filters.status) {
    where.push("status = ?");
    params.push(filters.status);
  }

  if (filters.search) {
    where.push("(client_name LIKE ? OR designation LIKE ? OR company LIKE ? OR message LIKE ?)");
    const search = `%${filters.search}%`;
    params.push(search, search, search, search);
  }

  const limit = makeLimit(filters.limit, 20, 100);
  const offset = makeOffset(filters.offset);
  params.push(limit, offset);

  const sql = [
    `SELECT * FROM \`${tables.testimonials}\``,
    where.length ? `WHERE ${where.join(" AND ")}` : "",
    "ORDER BY sort_order ASC, created_at DESC",
    "LIMIT ? OFFSET ?"
  ].filter(Boolean).join(" ");

  return db.query(sql, params);
}

async function getTestimonial(id) {
  const rows = await db.query(`SELECT * FROM \`${tables.testimonials}\` WHERE id = ? LIMIT 1`, [id]);
  return rows[0] || null;
}

async function createTestimonial(data) {
  const statement = insertStatement(tables.testimonials, data, testimonialFields);
  return db.execute(statement.sql, statement.params);
}

async function updateTestimonial(id, data) {
  const statement = updateStatement(tables.testimonials, id, data, testimonialFields);
  return db.execute(statement.sql, statement.params);
}

async function deleteTestimonial(id) {
  return db.execute(`DELETE FROM \`${tables.testimonials}\` WHERE id = ?`, [id]);
}

module.exports = {
  createTestimonial,
  deleteTestimonial,
  getTestimonial,
  listTestimonials,
  updateTestimonial
};
