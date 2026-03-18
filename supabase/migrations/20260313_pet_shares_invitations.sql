-- =============================================================
-- Migration: Create pet_shares and pet_invitations tables with RLS
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- =============================================================

-- 1. pet_shares table
CREATE TABLE IF NOT EXISTS public.pet_shares (
  id            TEXT        PRIMARY KEY,
  pet_id        TEXT        NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  owner_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_email  TEXT,
  member_display_name TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pet_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pet_shares: select own" ON public.pet_shares
  FOR SELECT USING (auth.uid() = owner_id OR auth.uid() = member_id);

CREATE POLICY "pet_shares: insert own" ON public.pet_shares
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "pet_shares: delete own" ON public.pet_shares
  FOR DELETE USING (auth.uid() = owner_id);

CREATE INDEX IF NOT EXISTS idx_pet_shares_owner_id  ON public.pet_shares(owner_id);
CREATE INDEX IF NOT EXISTS idx_pet_shares_member_id ON public.pet_shares(member_id);
CREATE INDEX IF NOT EXISTS idx_pet_shares_pet_id    ON public.pet_shares(pet_id);

-- 2. pet_invitations table
CREATE TABLE IF NOT EXISTS public.pet_invitations (
  id             TEXT        PRIMARY KEY,
  pet_id         TEXT        NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  owner_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_email  TEXT        NOT NULL,
  status         TEXT        NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  expires_at     TIMESTAMPTZ NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pet_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pet_invitations: select own" ON public.pet_invitations
  FOR SELECT USING (auth.uid() = owner_id OR auth.email() = invitee_email);

CREATE POLICY "pet_invitations: insert own" ON public.pet_invitations
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "pet_invitations: update status" ON public.pet_invitations
  FOR UPDATE USING (auth.uid() = owner_id OR auth.email() = invitee_email);

CREATE POLICY "pet_invitations: delete own" ON public.pet_invitations
  FOR DELETE USING (auth.uid() = owner_id);

CREATE INDEX IF NOT EXISTS idx_pet_invitations_owner_id     ON public.pet_invitations(owner_id);
CREATE INDEX IF NOT EXISTS idx_pet_invitations_invitee_email ON public.pet_invitations(invitee_email);
CREATE INDEX IF NOT EXISTS idx_pet_invitations_pet_id       ON public.pet_invitations(pet_id);
