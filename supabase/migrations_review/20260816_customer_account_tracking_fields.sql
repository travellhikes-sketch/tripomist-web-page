-- 1. Add missing profile fields
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS pin_code TEXT;

-- 2. Add traveller status
ALTER TABLE public.booking_travellers
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'completed'));

-- 3. Add package track state to bookings
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS package_track_state TEXT NOT NULL DEFAULT 'booking_placed' 
  CHECK (package_track_state IN (
    'booking_placed', 
    'booking_confirmed', 
    'trip_scheduled', 
    'full_payment_received', 
    'trip_completed'
  ));

-- 4. Add support settings to site_settings
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS support_whatsapp TEXT,
  ADD COLUMN IF NOT EXISTS support_call TEXT,
  ADD COLUMN IF NOT EXISTS support_email TEXT;

-- 5. Revoke column-level update from anon/authenticated to prevent abuse if broad UPDATE exists
-- Profiles: Customers update their own profiles via standard RLS, so these are safe to be updated by customer.
-- Bookings, Booking Travellers, Site Settings: These new administrative columns should be protected.
REVOKE UPDATE (package_track_state) ON public.bookings FROM authenticated, anon;
REVOKE UPDATE (status) ON public.booking_travellers FROM authenticated, anon;
REVOKE UPDATE (support_whatsapp, support_call, support_email) ON public.site_settings FROM authenticated, anon;

-- Note: Admin functions or users with bypass_rls (service_role) or explicit admin roles can still update these.
