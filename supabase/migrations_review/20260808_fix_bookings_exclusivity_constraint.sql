-- Fix check_bookings_user_or_lead_exclusivity to enforce AT MOST ONE linked source, allowing unlinked (both NULL) bookings.
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS check_bookings_user_or_lead_exclusivity;

ALTER TABLE public.bookings ADD CONSTRAINT check_bookings_user_or_lead_exclusivity
  CHECK (
    user_id IS NULL OR checkout_lead_id IS NULL
  );
