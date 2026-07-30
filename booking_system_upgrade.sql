-- SQL Migration: Tripomist Booking System & UI Upgrades (Secure Version)

-- 1. Promotional Banners Extension
ALTER TABLE public.promotional_banners 
  ADD COLUMN IF NOT EXISTS internal_name TEXT,
  ADD COLUMN IF NOT EXISTS promo_stripe_text TEXT,
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS page_title TEXT,
  ADD COLUMN IF NOT EXISTS page_subtitle TEXT,
  ADD COLUMN IF NOT EXISTS content TEXT,
  ADD COLUMN IF NOT EXISTS highlighted_text TEXT,
  ADD COLUMN IF NOT EXISTS price_text TEXT,
  ADD COLUMN IF NOT EXISTS desktop_image TEXT,
  ADD COLUMN IF NOT EXISTS mobile_image TEXT,
  ADD COLUMN IF NOT EXISTS cta_text TEXT DEFAULT 'View Offer',
  ADD COLUMN IF NOT EXISTS cta_link TEXT,
  ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

CREATE UNIQUE INDEX IF NOT EXISTS idx_promo_banners_slug_unique ON public.promotional_banners (slug) WHERE slug IS NOT NULL;

-- 2. Package Card CTA Extensions
ALTER TABLE public."Pakage"
  ADD COLUMN IF NOT EXISTS card_cta_text TEXT DEFAULT 'Click',
  ADD COLUMN IF NOT EXISTS card_cta_action TEXT DEFAULT 'open_package' CHECK (card_cta_action IN ('open_package', 'coming_soon', 'custom_url')),
  ADD COLUMN IF NOT EXISTS card_cta_url TEXT;

-- 3. Admin Booking Cancellation Extensions
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
  ADD COLUMN IF NOT EXISTS cancellation_notes TEXT,
  ADD COLUMN IF NOT EXISTS refund_status TEXT CHECK (refund_status IN ('Not Applicable', 'No Refund', 'Refund Pending', 'Partially Refunded', 'Fully Refunded'));

ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_cancellation_check;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_cancellation_check 
  CHECK (booking_status != 'cancelled' OR (cancellation_reason IS NOT NULL AND cancelled_at IS NOT NULL));

-- 4. Problem Faced Clients / Service Recovery Cases
CREATE TABLE IF NOT EXISTS public.service_recovery_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    issue_title TEXT NOT NULL,
    issue_description TEXT NOT NULL,
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    status TEXT CHECK (status IN ('open', 'under_review', 'resolved', 'closed')) DEFAULT 'open',
    incident_date DATE,
    internal_notes TEXT,
    resolution_notes TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- Idempotent Indexes for Service Recovery Cases
CREATE INDEX IF NOT EXISTS idx_src_user_id ON public.service_recovery_cases (user_id);
CREATE INDEX IF NOT EXISTS idx_src_booking_id ON public.service_recovery_cases (booking_id);
CREATE INDEX IF NOT EXISTS idx_src_status ON public.service_recovery_cases (status);
CREATE INDEX IF NOT EXISTS idx_src_priority ON public.service_recovery_cases (priority);
CREATE INDEX IF NOT EXISTS idx_src_created_at ON public.service_recovery_cases (created_at DESC);

-- Unique updated_at function for service recovery
CREATE OR REPLACE FUNCTION public.set_service_recovery_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS update_service_recovery_modtime ON public.service_recovery_cases;
CREATE TRIGGER update_service_recovery_modtime
    BEFORE UPDATE ON public.service_recovery_cases
    FOR EACH ROW
    EXECUTE FUNCTION public.set_service_recovery_updated_at();

-- Secure Admin-Only RLS Policies for Service Recovery
ALTER TABLE public.service_recovery_cases ENABLE ROW LEVEL SECURITY;

-- Revoke all generic public/anon access on the table to be perfectly secure
REVOKE ALL ON public.service_recovery_cases FROM PUBLIC;
REVOKE ALL ON public.service_recovery_cases FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_recovery_cases TO authenticated;

-- Drop unsafe or old policies
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.service_recovery_cases;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.service_recovery_cases;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.service_recovery_cases;
DROP POLICY IF EXISTS "Admin SELECT service_recovery_cases" ON public.service_recovery_cases;
DROP POLICY IF EXISTS "Admin INSERT service_recovery_cases" ON public.service_recovery_cases;
DROP POLICY IF EXISTS "Admin UPDATE service_recovery_cases" ON public.service_recovery_cases;
DROP POLICY IF EXISTS "Admin DELETE service_recovery_cases" ON public.service_recovery_cases;

-- Create STRICT admin-only policies using existing public.is_admin()
CREATE POLICY "Admin SELECT service_recovery_cases" ON public.service_recovery_cases
    FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY "Admin INSERT service_recovery_cases" ON public.service_recovery_cases
    FOR INSERT TO authenticated WITH CHECK (public.is_admin());

CREATE POLICY "Admin UPDATE service_recovery_cases" ON public.service_recovery_cases
    FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admin DELETE service_recovery_cases" ON public.service_recovery_cases
    FOR DELETE TO authenticated USING (public.is_admin());
