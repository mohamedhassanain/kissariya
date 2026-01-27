-- =====================================================
-- EXTENSION
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- PROFILES
-- =====================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- SHOPS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  cover_url TEXT, -- ✅ AJOUTÉ
  whatsapp_number TEXT NOT NULL,
  location_city TEXT,
  location_url TEXT,
  show_location BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- CATEGORIES
-- =====================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- SUBCATEGORIES
-- =====================================================
CREATE TABLE IF NOT EXISTS public.subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- PRODUCTS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  subcategory_id UUID REFERENCES public.subcategories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  original_price NUMERIC,
  is_promotion BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  image_url TEXT,
  location_city TEXT,
  location_url TEXT,
  show_location BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- KISSARIYA_VIEWS (ancien catalog_views)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.kissariya_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  visitor_ip TEXT,
  user_agent TEXT,
  viewed_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- PRODUCT_VIEWS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.product_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- RLS ACTIVATION
-- =====================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kissariya_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_views ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- profiles
CREATE POLICY "profiles_select_own"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "profiles_insert_own"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_update_own"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

-- shops
CREATE POLICY "shops_public_select"
ON public.shops FOR SELECT
USING (true);

CREATE POLICY "shops_owner_manage"
ON public.shops FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- categories
CREATE POLICY "categories_public_select"
ON public.categories FOR SELECT
USING (true);

CREATE POLICY "categories_owner_manage"
ON public.categories FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.shops
    WHERE shops.id = categories.shop_id
    AND shops.user_id = auth.uid()
  )
);

-- subcategories
CREATE POLICY "subcategories_public_select"
ON public.subcategories FOR SELECT
USING (true);

CREATE POLICY "subcategories_owner_manage"
ON public.subcategories FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.categories
    JOIN public.shops ON shops.id = categories.shop_id
    WHERE categories.id = subcategories.category_id
    AND shops.user_id = auth.uid()
  )
);

-- products
CREATE POLICY "products_public_select"
ON public.products FOR SELECT
USING (is_active = true);

CREATE POLICY "products_owner_manage"
ON public.products FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.shops
    WHERE shops.id = products.shop_id
    AND shops.user_id = auth.uid()
  )
);

-- kissariya_views
CREATE POLICY "kissariya_views_insert_public"
ON public.kissariya_views FOR INSERT
WITH CHECK (true);

CREATE POLICY "kissariya_views_owner_select"
ON public.kissariya_views FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.shops
    WHERE shops.id = kissariya_views.shop_id
    AND shops.user_id = auth.uid()
  )
);

-- product_views
CREATE POLICY "product_views_insert_public"
ON public.product_views FOR INSERT
WITH CHECK (true);

CREATE POLICY "product_views_owner_select"
ON public.product_views FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.shops
    WHERE shops.id = product_views.shop_id
    AND shops.user_id = auth.uid()
  )
);

-- =====================================================
-- TRIGGER updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_shops_updated_at
BEFORE UPDATE ON public.shops
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_subcategories_updated_at
BEFORE UPDATE ON public.subcategories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- AUTO CREATE PROFILE ON SIGNUP
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- STORAGE (IMAGES)
-- =====================================================
-- Function to centralize bucket name and avoid duplication smells
CREATE OR REPLACE FUNCTION public.get_storage_bucket_name()
RETURNS TEXT AS $$
BEGIN
  RETURN 'shop-images';
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = public;

INSERT INTO storage.buckets (id, name, public)
VALUES (public.get_storage_bucket_name(), public.get_storage_bucket_name(), true)
ON CONFLICT DO NOTHING;

CREATE POLICY "shop_images_public_select"
ON storage.objects FOR SELECT
USING (bucket_id = public.get_storage_bucket_name());

CREATE POLICY "shop_images_authenticated_manage"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = public.get_storage_bucket_name())
WITH CHECK (bucket_id = public.get_storage_bucket_name());

-- =====================================================
-- REFRESH SUPABASE SCHEMA
-- =====================================================
NOTIFY pgrst, 'reload schema';
