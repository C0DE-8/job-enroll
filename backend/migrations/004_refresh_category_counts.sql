UPDATE categories c
SET job_count = (
  SELECT COUNT(*)
  FROM jobs j
  WHERE j.category = c.name AND j.status = 'active'
);
