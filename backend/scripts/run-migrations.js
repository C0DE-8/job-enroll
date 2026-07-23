require("dotenv").config();

const fs = require("fs");
const path = require("path");
const db = require("../db");

function splitSqlStatements(sql) {
  return sql
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);
}

async function run() {
  const migrationsDir = path.join(__dirname, "..", "migrations");
  const files = fs.readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    const statements = splitSqlStatements(sql);

    console.log(`Running ${file} (${statements.length} statements)`);

    for (const statement of statements) {
      await db.execute(statement);
    }
  }

  console.log("Migrations complete");
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
