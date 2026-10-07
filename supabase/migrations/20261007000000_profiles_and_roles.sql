-- supabase/migrations/20261007000000_profiles_and_roles.sql
--
-- HOME INTERIOR — SECURE PROFILES, ROLES, AND RLS POLICY DEFINITIONS
--
-- Roles: 'customer' (default), 'editor', 'admin', 'owner'
-- Tamper-proof server authorization with Row Level Security.
-- Additive and idempotent.

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'editor', 'admin', 'owner')),
  display_name text,
  phone text,
  address text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for role lookup performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Drop legacy policies if they exist (idempotent)
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
  DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- 3. Row Level Security Policies

-- Customers and operators can read their own profile row
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Customers can update only their own profile details (cannot escalate their own role)
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
  );

-- Admins and owners can read all profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'owner')
    )
  );

-- Admins and owners can update any profile (including role promotions)
CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'owner')
    )
  );

-- 4. Trigger to automatically create a customer profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, role, display_name, phone, address, created_at, updated_at)
  VALUES (
    new.id,
    COALESCE((new.app_metadata->>'role'), 'customer'),
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'fullName', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'address',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    display_name = EXCLUDED.display_name,
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
    address = COALESCE(EXCLUDED.address, public.profiles.address),
    updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger idempotently
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. Safe Owner/Admin Bootstrap Function
-- Can be called from Supabase SQL editor:
-- SELECT public.promote_user_to_admin('admin@homeinterior.pk');
CREATE OR REPLACE FUNCTION public.promote_user_to_admin(target_email text)
RETURNS text AS $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE LOWER(email) = LOWER(target_email);
  IF v_user_id IS NULL THEN
    RETURN 'ERROR: No auth user found with email ' || target_email;
  END IF;

  -- Upsert profile with admin role
  INSERT INTO public.profiles (id, role, updated_at)
  VALUES (v_user_id, 'admin', now())
  ON CONFLICT (id) DO UPDATE SET role = 'admin', updated_at = now();

  -- Update app_metadata in auth.users
  UPDATE auth.users
  SET raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'::jsonb
  WHERE id = v_user_id;

  RETURN 'SUCCESS: User ' || target_email || ' (ID: ' || v_user_id || ') promoted to admin.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

