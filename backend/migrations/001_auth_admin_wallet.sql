CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(128) NOT NULL,
  role VARCHAR(30) NOT NULL DEFAULT 'candidate',
  is_verified TINYINT(1) NOT NULL DEFAULT 0,
  verification_status VARCHAR(30) NOT NULL DEFAULT 'pending',
  payment_status VARCHAR(30) NOT NULL DEFAULT 'not_required',
  payment_reference VARCHAR(255) NULL,
  employer_fee_amount DECIMAL(12,2) NULL,
  verified_by INT NULL,
  verified_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_role (role),
  INDEX idx_users_verification_status (verification_status)
);

CREATE TABLE IF NOT EXISTS payment_settings (
  id INT PRIMARY KEY,
  registration_fee DECIMAL(12,2) NOT NULL DEFAULT 25.00,
  fee_currency VARCHAR(20) NOT NULL DEFAULT 'USDT',
  wallet_name VARCHAR(120) NOT NULL,
  wallet_address VARCHAR(255) NOT NULL,
  updated_by INT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS employer_payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employer_id INT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(20) NOT NULL DEFAULT 'USDT',
  wallet_name VARCHAR(120) NOT NULL,
  wallet_address VARCHAR(255) NOT NULL,
  transaction_reference VARCHAR(255) NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_employer_payments_employer_id (employer_id),
  INDEX idx_employer_payments_status (status)
);

INSERT INTO users (email, password_hash, role, is_verified, verification_status, payment_status)
VALUES ('admin@admin.com', SHA2('123456', 256), 'admin', 1, 'verified', 'not_required')
ON DUPLICATE KEY UPDATE
  password_hash = VALUES(password_hash),
  role = 'admin',
  is_verified = 1,
  verification_status = 'verified',
  payment_status = 'not_required';

INSERT INTO payment_settings (id, registration_fee, fee_currency, wallet_name, wallet_address, updated_by)
VALUES (1, 25.00, 'USDT', 'Career Recruit Demo Wallet', 'TRC20_DEMO_WALLET_ADDRESS_CHANGE_ME', NULL)
ON DUPLICATE KEY UPDATE
  registration_fee = VALUES(registration_fee),
  fee_currency = VALUES(fee_currency),
  wallet_name = VALUES(wallet_name),
  wallet_address = VALUES(wallet_address);
