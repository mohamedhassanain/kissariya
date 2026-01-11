-- Script de correction consolidé pour la base de données

-- 1. Ajout des colonnes de localisation à la table products
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS location_city TEXT,
ADD COLUMN IF NOT EXISTS location_url TEXT,
ADD COLUMN IF NOT EXISTS show_location BOOLEAN DEFAULT FALSE;

-- 2. Ajout des colonnes de localisation et couverture à la table shops
ALTER TABLE public.shops 
ADD COLUMN IF NOT EXISTS location_city TEXT,
ADD COLUMN IF NOT EXISTS location_url TEXT,
ADD COLUMN IF NOT EXISTS show_location BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS cover_url TEXT;

-- 3. Renommer la table de statistiques si nécessaire
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'catalog_views') THEN
    ALTER TABLE public.catalog_views RENAME TO kissariya_views;
  END IF;
END $$;

-- 4. Rafraîchir le cache PostgREST
NOTIFY pgrst, 'reload schema';
