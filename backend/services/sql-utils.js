function makeLimit(value, fallback = 20, max = 100) {
  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.min(parsed, max);
}

function makeOffset(value) {
  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed) || parsed < 0) {
    return 0;
  }

  return parsed;
}

function insertStatement(table, data, allowedFields) {
  const fields = allowedFields.filter((field) => data[field] !== undefined);

  if (!fields.length) {
    const error = new Error("No valid fields provided");
    error.statusCode = 400;
    throw error;
  }

  const columns = fields.map((field) => `\`${field}\``).join(", ");
  const placeholders = fields.map(() => "?").join(", ");
  const params = fields.map((field) => data[field]);

  return {
    sql: `INSERT INTO \`${table}\` (${columns}) VALUES (${placeholders})`,
    params
  };
}

function updateStatement(table, id, data, allowedFields) {
  const fields = allowedFields.filter((field) => data[field] !== undefined);

  if (!fields.length) {
    const error = new Error("No valid fields provided");
    error.statusCode = 400;
    throw error;
  }

  const assignments = fields.map((field) => `\`${field}\` = ?`).join(", ");
  const params = fields.map((field) => data[field]);
  params.push(id);

  return {
    sql: `UPDATE \`${table}\` SET ${assignments} WHERE id = ?`,
    params
  };
}

module.exports = {
  insertStatement,
  makeLimit,
  makeOffset,
  updateStatement
};
