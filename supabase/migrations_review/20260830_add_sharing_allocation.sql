BEGIN;

ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS sharing_allocation JSONB;

COMMIT;
