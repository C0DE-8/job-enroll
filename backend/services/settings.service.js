const db = require("../db");
const tables = require("../models/tables");

const defaultSettings = {
  registration_fee: 25,
  fee_currency: "USDT",
  wallet_name: "Career Recruit Demo Wallet",
  wallet_address: "TRC20_DEMO_WALLET_ADDRESS_CHANGE_ME"
};

async function getPaymentSettings() {
  const rows = await db.query(
    `SELECT registration_fee, fee_currency, wallet_name, wallet_address, updated_at FROM \`${tables.paymentSettings}\` WHERE id = 1 LIMIT 1`
  );

  return rows[0] || defaultSettings;
}

async function updatePaymentSettings(data, adminId) {
  const settings = {
    registration_fee: data.registration_fee,
    fee_currency: data.fee_currency || "USDT",
    wallet_name: data.wallet_name,
    wallet_address: data.wallet_address
  };

  if (!settings.registration_fee || !settings.wallet_name || !settings.wallet_address) {
    const error = new Error("registration_fee, wallet_name, and wallet_address are required");
    error.statusCode = 400;
    throw error;
  }

  await db.execute(
    `INSERT INTO \`${tables.paymentSettings}\` (id, registration_fee, fee_currency, wallet_name, wallet_address, updated_by)
     VALUES (1, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE registration_fee = VALUES(registration_fee), fee_currency = VALUES(fee_currency),
     wallet_name = VALUES(wallet_name), wallet_address = VALUES(wallet_address), updated_by = VALUES(updated_by)`,
    [settings.registration_fee, settings.fee_currency, settings.wallet_name, settings.wallet_address, adminId]
  );

  return getPaymentSettings();
}

module.exports = {
  getPaymentSettings,
  updatePaymentSettings
};
