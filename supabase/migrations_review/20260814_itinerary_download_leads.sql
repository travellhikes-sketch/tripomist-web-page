-- Migration to create itinerary_download_leads table

CREATE TABLE IF NOT EXISTS public.itinerary_download_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  phone text NOT NULL,
  expecting_callback boolean NOT NULL DEFAULT false,
  package_title text,
  package_slug text,
  itinerary_pdf_url text,
  source text NOT NULL DEFAULT 'itinerary_download',
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  CONSTRAINT phone_10_digits CHECK (phone ~ '^[0-9]{10}$'),
  CONSTRAINT status_allowed_values CHECK (status IN ('new', 'contacted')),
  CONSTRAINT source_must_be_itinerary_download CHECK (source = 'itinerary_download')
);

-- Auto-update updated_at on every UPDATE
CREATE OR REPLACE FUNCTION public.update_itinerary_leads_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS itinerary_leads_updated_at ON public.itinerary_download_leads;
CREATE TRIGGER itinerary_leads_updated_at
  BEFORE UPDATE ON public.itinerary_download_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_itinerary_leads_updated_at();

-- RLS Policies
ALTER TABLE public.itinerary_download_leads ENABLE ROW LEVEL SECURITY;

-- 1. Public INSERT
DROP POLICY IF EXISTS "anon_insert_itinerary_leads" ON public.itinerary_download_leads;
CREATE POLICY "anon_insert_itinerary_leads" ON public.itinerary_download_leads
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    source = 'itinerary_download' AND status = 'new'
  );

-- 2. Admin SELECT
DROP POLICY IF EXISTS "admin_select_itinerary_leads" ON public.itinerary_download_leads;
CREATE POLICY "admin_select_itinerary_leads" ON public.itinerary_download_leads
  FOR SELECT TO authenticated
  USING ( public.is_admin() );

-- 3. Admin UPDATE
DROP POLICY IF EXISTS "admin_update_itinerary_leads" ON public.itinerary_download_leads;
CREATE POLICY "admin_update_itinerary_leads" ON public.itinerary_download_leads
  FOR UPDATE TO authenticated
  USING ( public.is_admin() )
  WITH CHECK ( public.is_admin() );

-- 4. Admin DELETE
DROP POLICY IF EXISTS "admin_delete_itinerary_leads" ON public.itinerary_download_leads;
CREATE POLICY "admin_delete_itinerary_leads" ON public.itinerary_download_leads
  FOR DELETE TO authenticated
  USING ( public.is_admin() );
