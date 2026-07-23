const db = require("../db");
const tables = require("../models/tables");
const { insertStatement } = require("./sql-utils");

async function createContactMessage(data) {
  const statement = insertStatement(tables.contactMessages, {
    name: data.name || data.con_name,
    email: data.email || data.con_email,
    subject: data.subject,
    message: data.message || data.con_message
  }, ["name", "email", "subject", "message"]);

  return db.execute(statement.sql, statement.params);
}

module.exports = {
  createContactMessage
};
