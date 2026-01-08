-- Create profiles table for additional user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create shops table
CREATE TABLE public.shops (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  whatsapp_number TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create subcategories table
CREATE TABLE public.subcategories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  subcategory_id UUID REFERENCES public.subcategories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  is_promotion BOOLEAN NOT NULL DEFAULT false,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create catalog_views table for statistics
CREATE TABLE public.catalog_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  visitor_ip TEXT,
  user_agent TEXT
);

-- Create product_views table for product-level statistics
CREATE TABLE public.product_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_views ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Shops policies (owner access)
CREATE POLICY "Users can view their own shop" ON public.shops FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own shop" ON public.shops FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own shop" ON public.shops FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own shop" ON public.shops FOR DELETE USING (auth.uid() = user_id);
-- Public access to shops by slug
CREATE POLICY "Anyone can view shops by slug" ON public.shops FOR SELECT USING (true);

-- Categories policies
CREATE POLICY "Shop owners can manage categories" ON public.categories FOR ALL USING (
  EXISTS (SELECT 1 FROM public.shops WHERE shops.id = categories.shop_id AND shops.user_id = auth.uid())
);
CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT USING (true);

-- Subcategories policies
CREATE POLICY "Shop owners can manage subcategories" ON public.subcategories FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.categories 
    JOIN public.shops ON shops.id = categories.shop_id 
    WHERE categories.id = subcategories.category_id AND shops.user_id = auth.uid()
  )
);
CREATE POLICY "Anyone can view subcategories" ON public.subcategories FOR SELECT USING (true);

-- Products policies
CREATE POLICY "Shop owners can manage products" ON public.products FOR ALL USING (
  EXISTS (SELECT 1 FROM public.shops WHERE shops.id = products.shop_id AND shops.user_id = auth.uid())
);
CREATE POLICY "Anyone can view active products" ON public.products FOR SELECT USING (is_active = true);

-- Catalog views policies (public insert for tracking, owner can view)
CREATE POLICY "Anyone can insert catalog views" ON public.catalog_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Shop owners can view their catalog views" ON public.catalog_views FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.shops WHERE shops.id = catalog_views.shop_id AND shops.user_id = auth.uid())
);

-- Product views policies
CREATE POLICY "Anyone can insert product views" ON public.product_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Shop owners can view their product views" ON public.product_views FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.shops WHERE shops.id = product_views.shop_id AND shops.user_id = auth.uid())
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_shops_updated_at BEFORE UPDATE ON public.shops FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_subcategories_updated_at BEFORE UPDATE ON public.subcategories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create storage bucket for images
INSERT INTO storage.buckets (id, name, public) VALUES ('shop-images', 'shop-images', true);

-- Storage policies for shop images
CREATE POLICY "Anyone can view shop images" ON storage.objects FOR SELECT USING (bucket_id = 'shop-images');
CREATE POLICY "Authenticated users can upload shop images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'shop-images' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update their own shop images" ON storage.objects FOR UPDATE USING (bucket_id = 'shop-images' AND auth.role() = 'authenticated');
CREATE POLICY "Users can delete their own shop images" ON storage.objects FOR DELETE USING (bucket_id = 'shop-images' AND auth.role() = 'authenticated');