-- Ajout des colonnes de localisation à la table shops
ALTER TABLE public.shops 
ADD COLUMN IF NOT EXISTS location_city TEXT,
ADD COLUMN IF NOT EXISTS location_url TEXT,
ADD COLUMN IF NOT EXISTS show_location BOOLEAN DEFAULT FALSE;

-- Commentaire pour expliquer les colonnes
COMMENT ON COLUMN public.shops.location_city IS 'Ville de localisation de la boutique';
COMMENT ON COLUMN public.shops.location_url IS 'Lien Google Maps ou Waze vers la boutique';
COMMENT ON COLUMN public.shops.show_location IS 'Indique si la localisation de la boutique doit être affichée publiquement';
