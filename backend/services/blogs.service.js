const db = require("../db");
const tables = require("../models/tables");
const { insertStatement, makeLimit, makeOffset } = require("./sql-utils");

const commentFields = [
  "blog_id",
  "name",
  "email",
  "role_location",
  "message",
  "status"
];

async function listBlogs(filters = {}) {
  const where = [];
  const params = [];

  if (filters.status) {
    where.push("status = ?");
    params.push(filters.status);
  }

  if (filters.category) {
    where.push("category = ?");
    params.push(filters.category);
  }

  if (filters.search) {
    where.push("(title LIKE ? OR excerpt LIKE ? OR content LIKE ? OR tags LIKE ?)");
    const search = `%${filters.search}%`;
    params.push(search, search, search, search);
  }

  const limit = makeLimit(filters.limit, 10, 100);
  const offset = makeOffset(filters.offset);
  params.push(limit, offset);

  const sql = [
    `SELECT * FROM \`${tables.blogs}\``,
    where.length ? `WHERE ${where.join(" AND ")}` : "",
    "ORDER BY published_at DESC, created_at DESC",
    "LIMIT ? OFFSET ?"
  ].filter(Boolean).join(" ");

  return db.query(sql, params);
}

async function getBlog(idOrSlug) {
  const field = /^\d+$/.test(String(idOrSlug)) ? "id" : "slug";
  const rows = await db.query(`SELECT * FROM \`${tables.blogs}\` WHERE ${field} = ? LIMIT 1`, [idOrSlug]);
  return rows[0] || null;
}

async function listBlogCategories() {
  return db.query(
    `SELECT category, COUNT(*) AS post_count FROM \`${tables.blogs}\` WHERE status = ? GROUP BY category ORDER BY category ASC`,
    ["published"]
  );
}

async function listComments(blogId, filters = {}) {
  const params = [blogId];
  const where = ["blog_id = ?"];

  if (filters.status) {
    where.push("status = ?");
    params.push(filters.status);
  }

  const limit = makeLimit(filters.limit, 20, 100);
  const offset = makeOffset(filters.offset);
  params.push(limit, offset);

  return db.query(
    `SELECT * FROM \`${tables.blogComments}\` WHERE ${where.join(" AND ")} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    params
  );
}

async function createComment(blogId, data) {
  const payload = {
    ...data,
    blog_id: blogId,
    status: data.status || "approved"
  };
  const statement = insertStatement(tables.blogComments, payload, commentFields);
  return db.execute(statement.sql, statement.params);
}

module.exports = {
  createComment,
  getBlog,
  listBlogCategories,
  listBlogs,
  listComments
};
