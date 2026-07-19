-- ============================================================
-- Phase 1: checkout_leads table, triggers, RLS, and RPC
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Create the table
CREATE TABLE IF NOT EXISTS public.checkout_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_number text UNIQUE,
  lead_token text UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  customer_name text NOT NULL,
  phone text NOT NULL,
  email text,
  package_id bigint,
  package_title text,
  destination text,
  travel_date date,
  travellers integer,
  selected_sharing text,
  estimated_amount numeric,
  source text,
  special_request text,
  lead_status text DEFAULT 'checkout_started',
  payment_status text DEFAULT 'not_started',
  booking_id text,
  razorpay_payment_id text,
  user_id uuid,
  current_step text DEFAULT 'popup_submitted',
  last_activity_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Auto-generate lead_number (TML000001, TML000002, ...)
CREATE OR REPLACE FUNCTION generate_lead_number()
RETURNS trigger AS $$
DECLARE
  next_num integer;
BEGIN
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(lead_number FROM 4) AS integer)
  ), 0) + 1 INTO next_num FROM public.checkout_leads;
  NEW.lead_number := 'TML' || LPAD(next_num::text, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_lead_number ON public.checkout_leads;
CREATE TRIGGER set_lead_number
  BEFORE INSERT ON public.checkout_leads
  FOR EACH ROW
  WHEN (NEW.lead_number IS NULL)
  EXECUTE FUNCTION generate_lead_number();

-- 3. Auto-update updated_at on every UPDATE
CREATE OR REPLACE FUNCTION update_checkout_leads_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS checkout_leads_updated_at ON public.checkout_leads;
CREATE TRIGGER checkout_leads_updated_at
  BEFORE UPDATE ON public.checkout_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_checkout_leads_updated_at();

-- 4. Enable RLS
ALTER TABLE public.checkout_leads ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies

-- Anonymous and authenticated users can INSERT leads
DROP POLICY IF EXISTS "anon_insert_leads" ON public.checkout_leads;
CREATE POLICY "anon_insert_leads" ON public.checkout_leads
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Admins can SELECT all leads
DROP POLICY IF EXISTS "admin_select_leads" ON public.checkout_leads;
CREATE POLICY "admin_select_leads" ON public.checkout_leads
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can UPDATE all leads
DROP POLICY IF EXISTS "admin_update_leads" ON public.checkout_leads;
CREATE POLICY "admin_update_leads" ON public.checkout_leads
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can DELETE all leads
DROP POLICY IF EXISTS "admin_delete_leads" ON public.checkout_leads;
CREATE POLICY "admin_delete_leads" ON public.checkout_leads
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 6. Secure RPC for guest lead updates (uses lead_token for auth)
CREATE OR REPLACE FUNCTION update_checkout_lead(
  p_lead_id uuid,
  p_lead_token text,
  p_current_step text DEFAULT NULL,
  p_lead_status text DEFAULT NULL,
  p_payment_status text DEFAULT NULL,
  p_selected_sharing text DEFAULT NULL,
  p_estimated_amount numeric DEFAULT NULL,
  p_booking_id text DEFAULT NULL,
  p_razorpay_payment_id text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.checkout_leads
  SET
    current_step = COALESCE(p_current_step, current_step),
    lead_status = COALESCE(p_lead_status, lead_status),
    payment_status = COALESCE(p_payment_status, payment_status),
    selected_sharing = COALESCE(p_selected_sharing, selected_sharing),
    estimated_amount = COALESCE(p_estimated_amount, estimated_amount),
    booking_id = COALESCE(p_booking_id, booking_id),
    razorpay_payment_id = COALESCE(p_razorpay_payment_id, razorpay_payment_id),
    last_activity_at = now()
  WHERE id = p_lead_id
    AND lead_token = p_lead_token;
END;
$$;
