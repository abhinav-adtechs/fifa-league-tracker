-- Set password for admin mukul (run in Supabase → SQL Editor).
-- Plaintext: killerindiafc
--
-- verify_admin_password only checks rows with is_active = true — if login still
-- fails after UPDATE, run the SELECT at the bottom; it must return mukul's row.

UPDATE admin_passwords
SET
  password_hash = crypt('killerindiafc', gen_salt('bf')),
  is_active = true
WHERE lower(trim(name)) = 'mukul';

-- Should return one row with name = mukul when the password is correct:
-- SELECT * FROM public.verify_admin_password('killerindiafc');
