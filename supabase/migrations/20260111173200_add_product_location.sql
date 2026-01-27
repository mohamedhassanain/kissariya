-- Ajout des colonnes de localisation à la table products
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS location_city TEXT,
ADD COLUMN IF NOT EXISTS location_url TEXT,
ADD COLUMN IF NOT EXISTS show_location BOOLEAN DEFAULT FALSE;

-- Commentaire pour expliquer les colonnes
COMMENT ON COLUMN public.products.location_city IS 'Ville de localisation du produit';
COMMENT ON COLUMN public.products.location_url IS 'Lien Google Maps ou Waze vers la boutique';
COMMENT ON COLUMN public.products.show_location IS 'Indique si la localisation doit être affichée publiquement';
