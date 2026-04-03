-- Run in Supabase → SQL Editor (same project as your app’s SUPABASE_URL).
--
-- 1) See every admin row (names are stored exactly as inserted):
SELECT id, name, is_active, created_at
FROM admin_passwords
ORDER BY name;

-- 2) If there is NO row for mukul, add one (password: killerindiafc):
INSERT INTO admin_passwords (name, password_hash, is_active)
SELECT 'mukul', crypt('killerindiafc', gen_salt('bf')), true
WHERE NOT EXISTS (
  SELECT 1 FROM admin_passwords WHERE lower(trim(name)) = 'mukul'
);

-- 3) Confirm login RPC returns mukul:
SELECT * FROM public.verify_admin_password('killerindiafc');
