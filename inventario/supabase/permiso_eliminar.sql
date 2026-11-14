-- ==============================================================================
-- PERMISO PARA ELIMINAR (can_delete) + PROTECCIÓN A NIVEL BASE DE DATOS (RLS)
-- Ejecutar completo en: Supabase > SQL Editor > New query > Run
-- ==============================================================================

-- 1. Nueva columna de permiso en los perfiles
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS can_delete BOOLEAN DEFAULT false;

-- Los administradores siempre pueden eliminar
UPDATE public.user_profiles SET can_delete = true WHERE role = 'admin';

-- 2. Función auxiliar: ¿el usuario conectado tiene permiso de eliminar?
CREATE OR REPLACE FUNCTION public.user_can_delete()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_profiles
    WHERE id = auth.uid()
      AND COALESCE(is_active, true) = true
      AND (role = 'admin' OR can_delete = true)
  );
$$;

-- 3. Actualizar el trigger de alta de usuarios para guardar can_delete
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  is_first_user BOOLEAN;
BEGIN
  SELECT NOT EXISTS (SELECT 1 FROM public.user_profiles) INTO is_first_user;

  INSERT INTO public.user_profiles (
    id, full_name, email, role,
    can_access_inventory, can_access_loans, can_access_reports, can_delete, is_active
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    CASE WHEN is_first_user THEN 'admin'
         ELSE COALESCE(new.raw_user_meta_data->>'role', 'viewer') END,
    CASE WHEN is_first_user THEN true
         ELSE COALESCE((new.raw_user_meta_data->>'can_access_inventory')::boolean, true) END,
    CASE WHEN is_first_user THEN true
         ELSE COALESCE((new.raw_user_meta_data->>'can_access_loans')::boolean, false) END,
    CASE WHEN is_first_user THEN true
         ELSE COALESCE((new.raw_user_meta_data->>'can_access_reports')::boolean, false) END,
    CASE WHEN is_first_user THEN true
         ELSE COALESCE((new.raw_user_meta_data->>'can_delete')::boolean, false) END,
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.user_profiles.full_name);

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Separar las políticas "FOR ALL" para que DELETE quede restringido
--    (lectura, alta y edición se mantienen igual que antes)

-- ---------- PRODUCTOS ----------
DROP POLICY IF EXISTS "Permitir todo en productos" ON public.products;
DROP POLICY IF EXISTS "productos_select" ON public.products;
DROP POLICY IF EXISTS "productos_insert" ON public.products;
DROP POLICY IF EXISTS "productos_update" ON public.products;
DROP POLICY IF EXISTS "productos_delete" ON public.products;

CREATE POLICY "productos_select" ON public.products FOR SELECT
  USING (auth.role() = 'authenticated' OR auth.role() = 'anon');
CREATE POLICY "productos_insert" ON public.products FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');
CREATE POLICY "productos_update" ON public.products FOR UPDATE
  USING (auth.role() = 'authenticated' OR auth.role() = 'anon');
CREATE POLICY "productos_delete" ON public.products FOR DELETE
  USING (public.user_can_delete());

-- ---------- PRÉSTAMOS ----------
DROP POLICY IF EXISTS "Permitir todo en prestamos" ON public.loans;
DROP POLICY IF EXISTS "prestamos_select" ON public.loans;
DROP POLICY IF EXISTS "prestamos_insert" ON public.loans;
DROP POLICY IF EXISTS "prestamos_update" ON public.loans;
DROP POLICY IF EXISTS "prestamos_delete" ON public.loans;

CREATE POLICY "prestamos_select" ON public.loans FOR SELECT
  USING (auth.role() = 'authenticated' OR auth.role() = 'anon');
CREATE POLICY "prestamos_insert" ON public.loans FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');
CREATE POLICY "prestamos_update" ON public.loans FOR UPDATE
  USING (auth.role() = 'authenticated' OR auth.role() = 'anon');
CREATE POLICY "prestamos_delete" ON public.loans FOR DELETE
  USING (public.user_can_delete());

-- ---------- MOVIMIENTOS (consumos / ingresos) ----------
DROP POLICY IF EXISTS "Permitir todo en movimientos" ON public.movements;
DROP POLICY IF EXISTS "movimientos_select" ON public.movements;
DROP POLICY IF EXISTS "movimientos_insert" ON public.movements;
DROP POLICY IF EXISTS "movimientos_update" ON public.movements;
DROP POLICY IF EXISTS "movimientos_delete" ON public.movements;

CREATE POLICY "movimientos_select" ON public.movements FOR SELECT
  USING (auth.role() = 'authenticated' OR auth.role() = 'anon');
CREATE POLICY "movimientos_insert" ON public.movements FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');
CREATE POLICY "movimientos_update" ON public.movements FOR UPDATE
  USING (auth.role() = 'authenticated' OR auth.role() = 'anon');
CREATE POLICY "movimientos_delete" ON public.movements FOR DELETE
  USING (public.user_can_delete());
