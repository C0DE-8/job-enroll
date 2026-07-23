CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(180) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_newsletter_email (email),
  KEY idx_newsletter_status (status)
);

INSERT INTO newsletter_subscribers (email, status) VALUES
('candidate.updates@example.com', 'active'),
('employer.digest@example.com', 'active'),
('remote.jobs@example.com', 'active')
ON DUPLICATE KEY UPDATE
  status = VALUES(status),
  updated_at = CURRENT_TIMESTAMP;
