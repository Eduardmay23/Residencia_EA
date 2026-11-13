-- ==============================================================================
-- SISTEMA DE GESTIÓN DE USUARIOS Y PERMISOS GRANULARES (SUPABASE)
-- ==============================================================================

-- 1. Asegurar columnas de email y estado activo en user_profiles
ALTER TABLE public.user_profiles 
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Ajustar la restricción del rol para permitir admin, editor, viewer
ALTER TABLE public.user_profiles 
  DROP CONSTRAINT IF EXISTS user_profiles_role_check;

ALTER TABLE public.user_profiles 
  ADD CONSTRAINT user_profiles_role_check 
  CHECK (role IN ('admin', 'editor', 'viewer', 'user'));

-- 2. Función Trigger: Cada vez que se crea un usuario en auth.users,
--    se crea automáticamente su perfil en public.user_profiles con sus permisos
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  is_first_user BOOLEAN;
BEGIN
  -- Verificar si es el primer usuario del sistema para darle rol 'admin' automáticamente
  SELECT NOT EXISTS (SELECT 1 FROM public.user_profiles) INTO is_first_user;

  INSERT INTO public.user_profiles (
    id,
    full_name,
    email,
    role,
    can_access_inventory,
    can_access_loans,
    can_access_reports,
    is_active
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    CASE 
      WHEN is_first_user THEN 'admin'
      ELSE COALESCE(new.raw_user_meta_data->>'role', 'viewer')
    END,
    CASE 
      WHEN is_first_user THEN true
      ELSE COALESCE((new.raw_user_meta_data->>'can_access_inventory')::boolean, true)
    END,
    CASE 
      WHEN is_first_user THEN true
      ELSE COALESCE((new.raw_user_meta_data->>'can_access_loans')::boolean, false)
    END,
    CASE 
      WHEN is_first_user THEN true
      ELSE COALESCE((new.raw_user_meta_data->>'can_access_reports')::boolean, false)
    END,
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.user_profiles.full_name);

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Vincular el Trigger a la tabla auth.users de Supabase
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. Habilitar y actualizar políticas de seguridad RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Políticas para lectura y actualización
DROP POLICY IF EXISTS "Permitir lectura de perfiles" ON public.user_profiles;
CREATE POLICY "Permitir lectura de perfiles" ON public.user_profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir edicion de perfiles" ON public.user_profiles;
CREATE POLICY "Permitir edicion de perfiles" ON public.user_profiles
  FOR ALL USING (true);

