const db = require("../db");
const tables = require("../models/tables");
const { insertStatement } = require("./sql-utils");

async function subscribe(data) {
  if (!data.email) {
    const error = new Error("Email is required");
    error.statusCode = 400;
    throw error;
  }

  const statement = insertStatement(tables.newsletterSubscribers, data, ["email"]);
  return db.execute(statement.sql, statement.params);
}

module.exports = {
  subscribe
};
