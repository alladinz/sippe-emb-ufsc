ALTER TABLE study_plans ADD COLUMN IF NOT EXISTS contact TEXT;
ALTER TABLE study_plans ADD COLUMN IF NOT EXISTS office_hours TEXT;

UPDATE study_plans sp
SET contact = u.email
FROM "user" u
WHERE sp.user_id = u.id
  AND (sp.contact IS NULL OR BTRIM(sp.contact) = '')
  AND u.email IS NOT NULL;
