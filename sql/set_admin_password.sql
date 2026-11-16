-- Add an admin, or set a new password for an existing one (also re-activates it).
-- Run in Supabase -> SQL Editor after supabase_auth_setup.sql.
--
-- 1. Replace both placeholders below.
-- 2. Run the script.
-- 3. Clear the editor. Never commit a real password to this repository.

DO $$
DECLARE
  admin_name TEXT := '<admin-name>';
  new_password TEXT := '<new-password>';
BEGIN
  IF admin_name LIKE '<%>' OR new_password LIKE '<%>' THEN
    RAISE EXCEPTION 'Replace <admin-name> and <new-password> before running';
  END IF;

  UPDATE admin_passwords
  SET password_hash = crypt(new_password, gen_salt('bf')),
      is_active = true
  WHERE lower(trim(name)) = lower(trim(admin_name));

  IF NOT FOUND THEN
    INSERT INTO admin_passwords (name, password_hash, is_active)
    VALUES (trim(admin_name), crypt(new_password, gen_salt('bf')), true);
  END IF;
END $$;

-- Check the result:
-- SELECT id, name, is_active, created_at FROM admin_passwords ORDER BY name;
