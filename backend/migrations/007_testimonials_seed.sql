CREATE TABLE IF NOT EXISTS testimonials (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_name VARCHAR(140) NOT NULL,
  slug VARCHAR(170) NOT NULL,
  designation VARCHAR(140) NOT NULL,
  company VARCHAR(160) NULL,
  photo_url VARCHAR(255) NULL,
  message TEXT NOT NULL,
  rating INT NOT NULL DEFAULT 5,
  status VARCHAR(30) NOT NULL DEFAULT 'active',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_testimonials_slug (slug),
  KEY idx_testimonials_status (status),
  KEY idx_testimonials_sort (sort_order)
);

INSERT INTO testimonials (
  client_name,
  slug,
  designation,
  company,
  photo_url,
  message,
  rating,
  status,
  sort_order
) VALUES
('Roselia Hamets', 'roselia-hamets', 'Hiring Manager', 'BrightPath Health', 'assets/img/testimonial/1.jpg', 'Career Recruit helped our team move from slow inbox hiring to a cleaner shortlist of qualified candidates within days.', 5, 'active', 1),
('Assunta Manson', 'assunta-manson', 'Talent Acquisition Lead', 'Northstar Logistics', 'assets/img/testimonial/2.jpg', 'The enrollment flow made employer verification clear, and the candidate profiles gave our hiring team the details we needed before interviews.', 5, 'active', 2),
('Amira Shepard', 'amira-shepard', 'People Operations Manager', 'CloudWorks Studio', 'assets/img/testimonial/3.jpg', 'We filled two remote roles faster because the listings, categories, and candidate details were easy for applicants and managers to follow.', 5, 'active', 3),
('Joshua George', 'joshua-george', 'Recruiting Director', 'Vertex Finance', 'assets/img/testimonial/4.jpg', 'The platform gave us a professional place to publish jobs, review interest, and keep employer onboarding organized.', 4, 'active', 4),
('Rosie Patton', 'rosie-patton', 'HR Business Partner', 'Greenline Energy', 'assets/img/testimonial/5.jpg', 'Career Recruit gives candidates a clear view of the opportunity and gives our admin team simple control over what is published.', 5, 'active', 5),
('Daniel Okafor', 'daniel-okafor', 'Founder', 'RemoteOps Africa', 'assets/img/testimonial/1.jpg', 'Managing job categories, featured roles, and candidate information from one admin area has made the hiring process much easier to run.', 5, 'active', 6)
ON DUPLICATE KEY UPDATE
  client_name = VALUES(client_name),
  designation = VALUES(designation),
  company = VALUES(company),
  photo_url = VALUES(photo_url),
  message = VALUES(message),
  rating = VALUES(rating),
  status = VALUES(status),
  sort_order = VALUES(sort_order);
