-- =============================================================
-- Migration: Enable RLS + user_id on all public tables
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- =============================================================

-- 1. Add user_id column to each table (nullable first so existing rows don't break)
ALTER TABLE public.pets
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.vet_visits
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.pet_files
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.file_analyses
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Enable RLS on all tables
ALTER TABLE public.pets          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vet_visits    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pet_files     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_analyses ENABLE ROW LEVEL SECURITY;

-- 3. Policies for public.pets
CREATE POLICY "pets: select own" ON public.pets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "pets: insert own" ON public.pets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "pets: update own" ON public.pets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "pets: delete own" ON public.pets
  FOR DELETE USING (auth.uid() = user_id);

-- 4. Policies for public.vet_visits
CREATE POLICY "vet_visits: select own" ON public.vet_visits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "vet_visits: insert own" ON public.vet_visits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "vet_visits: update own" ON public.vet_visits
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "vet_visits: delete own" ON public.vet_visits
  FOR DELETE USING (auth.uid() = user_id);

-- 5. Policies for public.pet_files
CREATE POLICY "pet_files: select own" ON public.pet_files
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "pet_files: insert own" ON public.pet_files
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "pet_files: update own" ON public.pet_files
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "pet_files: delete own" ON public.pet_files
  FOR DELETE USING (auth.uid() = user_id);

-- 6. Policies for public.file_analyses
CREATE POLICY "file_analyses: select own" ON public.file_analyses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "file_analyses: insert own" ON public.file_analyses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "file_analyses: update own" ON public.file_analyses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "file_analyses: delete own" ON public.file_analyses
  FOR DELETE USING (auth.uid() = user_id);

-- 7. Add indexes for the new user_id columns
CREATE INDEX IF NOT EXISTS idx_pets_user_id          ON public.pets(user_id);
CREATE INDEX IF NOT EXISTS idx_vet_visits_user_id    ON public.vet_visits(user_id);
CREATE INDEX IF NOT EXISTS idx_pet_files_user_id     ON public.pet_files(user_id);
CREATE INDEX IF NOT EXISTS idx_file_analyses_user_id ON public.file_analyses(user_id);
