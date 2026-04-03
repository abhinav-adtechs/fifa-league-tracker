-- One-off: add admin `mukul` to an existing database.
-- Run in Supabase Dashboard → SQL Editor (once).
-- Plaintext password for Mukul: killerindiafc
--
-- If UPDATE ... WHERE name = 'mukul' affected 0 rows, the user was never inserted.
-- Prefer sql/ensure_mukul_admin.sql (lists all admins + conditional insert).

INSERT INTO admin_passwords (name, password_hash, is_active)
SELECT 'mukul', crypt('killerindiafc', gen_salt('bf')), true
WHERE NOT EXISTS (
  SELECT 1 FROM admin_passwords WHERE lower(trim(name)) = 'mukul'
);
