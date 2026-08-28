-- Migration: Create guest_otp_verifications table for secure server-side OTP
-- This table is NEVER accessible by anon/authenticated RLS.
-- All reads/writes happen only via service_role inside Edge Functions.
--
-- DO NOT EXECUTE AUTOMATICALLY — FOR REVIEW ONLY

CREATE TABLE IF NOT EXISTS public.guest_otp_verifications (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email        text        NOT NULL,
  purpose      text        NOT NULL,        -- 'itinerary_download' | 'booking'
  otp_hash     text        NOT NULL,        -- SHA-256 hex of raw OTP (server-side only)
  expires_at   timestamptz NOT NULL,
  attempts     integer     NOT NULL DEFAULT 0,
  verified_at  timestamptz             DEFAULT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT purpose_allowed CHECK (purpose IN ('itinerary_download', 'booking')),
  CONSTRAINT email_lower      CHECK (email = lower(email))
);

-- Index for fast lookup by email + purpose
CREATE INDEX IF NOT EXISTS idx_guest_otp_email_purpose
  ON public.guest_otp_verifications (email, purpose, expires_at DESC);

-- Auto-expire: clean up OTPs older than 1 hour periodically.
-- (Service-role Edge Function also filters by expires_at — this is defensive.)
CREATE OR REPLACE FUNCTION public.cleanup_expired_guest_otps()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  DELETE FROM public.guest_otp_verifications
  WHERE expires_at < now() - interval '1 hour';
END;
$$;

-- RLS: Enable and DENY all public/authenticated access.
-- Only the service_role (used inside Edge Functions) can interact with this table.
ALTER TABLE public.guest_otp_verifications ENABLE ROW LEVEL SECURITY;

-- No INSERT policy for anon/authenticated — Edge Function uses service_role which bypasses RLS.
-- No SELECT policy for anon/authenticated — same reason.
-- This effectively makes the table invisible/inaccessible to any browser client.

-- Optional: allow admins to view for debugging (comment out if not needed)
-- DROP POLICY IF EXISTS "admin_select_guest_otp" ON public.guest_otp_verifications;
-- CREATE POLICY "admin_select_guest_otp" ON public.guest_otp_verifications
--   FOR SELECT TO authenticated
--   USING ( public.is_admin() );
