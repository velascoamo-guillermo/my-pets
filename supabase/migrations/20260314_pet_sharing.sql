-- =============================================================
-- Migration: Pet sharing (pet_shares, pet_invitations, profiles)
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- =============================================================

-- -------------------------------------------------------
-- 1. profiles table (public mirror of auth.users)
--    Needed to show member names/emails without exposing auth.users directly
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT,
  display_name TEXT,
  avatar_url   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read profiles (needed to show member info)
CREATE POLICY "profiles: select authenticated" ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- Users can only update their own profile
CREATE POLICY "profiles: update own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Populate profile on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    email        = EXCLUDED.email,
    display_name = COALESCE(EXCLUDED.display_name, profiles.display_name),
    avatar_url   = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    updated_at   = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- -------------------------------------------------------
-- 2. pet_shares table
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pet_shares (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id     UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  owner_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (pet_id, member_id)
);

CREATE INDEX IF NOT EXISTS idx_pet_shares_pet_id    ON public.pet_shares(pet_id);
CREATE INDEX IF NOT EXISTS idx_pet_shares_member_id ON public.pet_shares(member_id);
CREATE INDEX IF NOT EXISTS idx_pet_shares_owner_id  ON public.pet_shares(owner_id);

ALTER TABLE public.pet_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pet_shares: select" ON public.pet_shares
  FOR SELECT USING (auth.uid() = owner_id OR auth.uid() = member_id);

CREATE POLICY "pet_shares: insert" ON public.pet_shares
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "pet_shares: delete" ON public.pet_shares
  FOR DELETE USING (auth.uid() = owner_id);

-- -------------------------------------------------------
-- 3. pet_invitations table
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pet_invitations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id        UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  owner_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_email TEXT NOT NULL,
  token         TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  expires_at    TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '7 days',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (pet_id, invitee_email)
);

CREATE INDEX IF NOT EXISTS idx_pet_invitations_pet_id        ON public.pet_invitations(pet_id);
CREATE INDEX IF NOT EXISTS idx_pet_invitations_invitee_email ON public.pet_invitations(invitee_email);
CREATE INDEX IF NOT EXISTS idx_pet_invitations_token         ON public.pet_invitations(token);

ALTER TABLE public.pet_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pet_invitations: select" ON public.pet_invitations
  FOR SELECT USING (
    auth.uid() = owner_id
    OR invitee_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "pet_invitations: insert" ON public.pet_invitations
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "pet_invitations: update" ON public.pet_invitations
  FOR UPDATE USING (
    auth.uid() = owner_id
    OR invitee_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "pet_invitations: delete" ON public.pet_invitations
  FOR DELETE USING (auth.uid() = owner_id);

-- -------------------------------------------------------
-- 4. RPC: accept_pet_invitation
--    Atomically accepts an invitation and creates the pet_share
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.accept_pet_invitation(p_invitation_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  inv RECORD;
BEGIN
  SELECT * INTO inv FROM public.pet_invitations
  WHERE id = p_invitation_id
    AND status = 'pending'
    AND expires_at > now()
    AND invitee_email = (SELECT email FROM public.profiles WHERE id = auth.uid());

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired invitation';
  END IF;

  INSERT INTO public.pet_shares (pet_id, owner_id, member_id, invited_by)
  VALUES (inv.pet_id, inv.owner_id, auth.uid(), inv.owner_id)
  ON CONFLICT (pet_id, member_id) DO NOTHING;

  UPDATE public.pet_invitations SET status = 'accepted' WHERE id = p_invitation_id;
END;
$$;

-- -------------------------------------------------------
-- 5. Update existing RLS policies to allow shared access
--    Replace "select own" and "update own" on all data tables
-- -------------------------------------------------------

-- pets
DROP POLICY IF EXISTS "pets: select own" ON public.pets;
DROP POLICY IF EXISTS "pets: update own" ON public.pets;

CREATE POLICY "pets: select own or shared" ON public.pets
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.pet_shares
      WHERE pet_shares.pet_id = pets.id
        AND pet_shares.member_id = auth.uid()
    )
  );

CREATE POLICY "pets: update own or shared" ON public.pets
  FOR UPDATE USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.pet_shares
      WHERE pet_shares.pet_id = pets.id
        AND pet_shares.member_id = auth.uid()
    )
  );

-- vet_visits
DROP POLICY IF EXISTS "vet_visits: select own" ON public.vet_visits;
DROP POLICY IF EXISTS "vet_visits: update own" ON public.vet_visits;

CREATE POLICY "vet_visits: select own or shared" ON public.vet_visits
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.pet_shares
      WHERE pet_shares.pet_id = vet_visits.pet_id
        AND pet_shares.member_id = auth.uid()
    )
  );

CREATE POLICY "vet_visits: update own or shared" ON public.vet_visits
  FOR UPDATE USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.pet_shares
      WHERE pet_shares.pet_id = vet_visits.pet_id
        AND pet_shares.member_id = auth.uid()
    )
  );

-- pet_files
DROP POLICY IF EXISTS "pet_files: select own" ON public.pet_files;
DROP POLICY IF EXISTS "pet_files: update own" ON public.pet_files;

CREATE POLICY "pet_files: select own or shared" ON public.pet_files
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.pet_shares
      WHERE pet_shares.pet_id = pet_files.pet_id
        AND pet_shares.member_id = auth.uid()
    )
  );

CREATE POLICY "pet_files: update own or shared" ON public.pet_files
  FOR UPDATE USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.pet_shares
      WHERE pet_shares.pet_id = pet_files.pet_id
        AND pet_shares.member_id = auth.uid()
    )
  );

-- file_analyses
DROP POLICY IF EXISTS "file_analyses: select own" ON public.file_analyses;
DROP POLICY IF EXISTS "file_analyses: update own" ON public.file_analyses;

CREATE POLICY "file_analyses: select own or shared" ON public.file_analyses
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.pet_shares
      WHERE pet_shares.pet_id = file_analyses.pet_id
        AND pet_shares.member_id = auth.uid()
    )
  );

CREATE POLICY "file_analyses: update own or shared" ON public.file_analyses
  FOR UPDATE USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.pet_shares
      WHERE pet_shares.pet_id = file_analyses.pet_id
        AND pet_shares.member_id = auth.uid()
    )
  );
