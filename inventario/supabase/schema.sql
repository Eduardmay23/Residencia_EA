-- ==============================================================================
-- SISTEMA DE INVENTARIO - ESQUEMA DE BASE DE DATOS (SUPABASE / POSTGRESQL)
-- ==============================================================================

-- 1. Habilitar extensión para UUIDs (si no está activa)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLA: CATEGORÍAS
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TABLA: PERFILES DE USUARIO
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'editor', 'viewer')),
    can_access_inventory BOOLEAN DEFAULT true,
    can_access_loans BOOLEAN DEFAULT true,
    can_access_reports BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TABLA: PRODUCTOS
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    sku TEXT NOT NULL UNIQUE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    category_name TEXT, -- Desnormalizado opcional para compatibilidad rápida con la UI
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    loaned INTEGER NOT NULL DEFAULT 0 CHECK (loaned >= 0),
    low_stock_threshold INTEGER NOT NULL DEFAULT 5,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. TABLA: PRÉSTAMOS
CREATE TABLE IF NOT EXISTS public.loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    loaned_to TEXT NOT NULL,
    delivered_by TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    loan_date TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    return_date TIMESTAMPTZ,
    return_image_data TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'returned')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. TABLA: MOVIMIENTOS (Entradas, Salidas, Mermas, Ajustes)
CREATE TABLE IF NOT EXISTS public.movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('consumption', 'adjustment', 'addition')),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    requested_by TEXT NOT NULL,
    dispatched_by TEXT NOT NULL,
    date TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    reason TEXT NOT NULL
);

-- 7. TABLA: ACTIVIDAD RECIENTE (Auditoría)
CREATE TABLE IF NOT EXISTS public.activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('loan_created', 'loan_returned', 'product_added', 'product_updated', 'stock_adjusted')),
    details TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices recomendados para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON public.loans(status);
CREATE INDEX IF NOT EXISTS idx_movements_product ON public.movements(product_id);

-- Configuración de Row Level Security (RLS)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS básicas (Permitir lectura y modificación a usuarios autenticados / lectura pública opcional)
CREATE POLICY "Permitir todo a usuarios autenticados en categorias" ON public.categories
    FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Permitir todo en productos" ON public.products
    FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Permitir todo en prestamos" ON public.loans
    FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Permitir todo en movimientos" ON public.movements
    FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Permitir todo en actividades" ON public.activities
    FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Lectura de perfiles para autenticados" ON public.user_profiles
    FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'anon');


