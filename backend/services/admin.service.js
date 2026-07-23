const db = require("../db");
const tables = require("../models/tables");

async function listPendingEmployers() {
  return db.query(
    `SELECT id, email, role, is_verified, verification_status, payment_status, employer_fee_amount, payment_reference, created_at
     FROM \`${tables.users}\`
     WHERE role = 'employer' AND is_verified = 0
     ORDER BY created_at DESC`
  );
}

async function verifyEmployer(id, adminId) {
  await db.execute(
    `UPDATE \`${tables.users}\`
     SET is_verified = 1, verification_status = 'verified', verified_by = ?, verified_at = CURRENT_TIMESTAMP
     WHERE id = ? AND role = 'employer'`,
    [adminId, id]
  );

  const rows = await db.query(
    `SELECT id, email, role, is_verified, verification_status, payment_status, employer_fee_amount, created_at
     FROM \`${tables.users}\` WHERE id = ? LIMIT 1`,
    [id]
  );

  return rows[0] || null;
}

module.exports = {
  listPendingEmployers,
  verifyEmployer
};
