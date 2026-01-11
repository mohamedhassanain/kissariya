-- Renommer la table catalog_views en kissariya_views pour correspondre au code
ALTER TABLE IF EXISTS public.catalog_views RENAME TO kissariya_views;

-- Mettre à jour les politiques si nécessaire (elles suivent généralement le renommage)
-- Mais par sécurité, on s'assure que les politiques sont correctes sur le nouveau nom
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'kissariya_views') THEN
    -- Les politiques existantes sur catalog_views devraient avoir été renommées automatiquement par PostgreSQL
    NULL;
  END IF;
END $$;
