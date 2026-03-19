-- ============================================
-- TRACE MAP - Setup Script Supabase
-- ============================================

-- 1. Créer le user debug (email: debug@tracemap.com, mdp: Debug123!)
-- Note: Le mot de passe doit respecter les standards (8+ chars, maj, min, chiffre, spécial)

-- Cette commande crée un user avec email confirmé (pas besoin de vérifier l'email)
SELECT auth.admin_create_user(
  'debug@tracemap.com',
  'Debug123!',
  true -- email_confirm = true
);

-- ============================================
-- 2. Vérifier que RLS est activé
-- ============================================

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_points ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. Policies pour activities
-- ============================================

-- Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "Users can view own activities" ON public.activities;
DROP POLICY IF EXISTS "Users can insert own activities" ON public.activities;
DROP POLICY IF EXISTS "Users can update own activities" ON public.activities;
DROP POLICY IF EXISTS "Users can delete own activities" ON public.activities;

-- Créer les nouvelles policies
CREATE POLICY "Users can view own activities"
  ON public.activities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activities"
  ON public.activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own activities"
  ON public.activities FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own activities"
  ON public.activities FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 4. Policies pour activity_points
-- ============================================

DROP POLICY IF EXISTS "Users can view own activity points" ON public.activity_points;
DROP POLICY IF EXISTS "Users can insert own activity points" ON public.activity_points;
DROP POLICY IF EXISTS "Users can update own activity points" ON public.activity_points;
DROP POLICY IF EXISTS "Users can delete own activity points" ON public.activity_points;

CREATE POLICY "Users can view own activity points"
  ON public.activity_points FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.activities
      WHERE activities.id = activity_points.activity_id
      AND activities.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own activity points"
  ON public.activity_points FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.activities
      WHERE activities.id = activity_points.activity_id
      AND activities.user_id = auth.uid()
    )
  );

-- ============================================
-- 5. Bucket Storage pour les fichiers GPX
-- ============================================

-- Créer le bucket s'il n'existe pas
INSERT INTO storage.buckets (id, name, public)
VALUES ('gpx-files', 'gpx-files', false)
ON CONFLICT (id) DO NOTHING;

-- Policy pour permettre aux users d'uploader dans leur dossier
DROP POLICY IF EXISTS "Users can upload to own folder" ON storage.objects;
CREATE POLICY "Users can upload to own folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'gpx-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy pour permettre aux users de lire leurs propres fichiers
DROP POLICY IF EXISTS "Users can read own files" ON storage.objects;
CREATE POLICY "Users can read own files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'gpx-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================
-- 6. Vérifications
-- ============================================

-- Vérifier que le user debug a été créé
-- SELECT * FROM auth.users WHERE email = 'debug@tracemap.com';

-- Vérifier les policies
-- SELECT * FROM pg_policies WHERE schemaname = 'public';
