-- Migration: Add departure_dates and available_weekdays to Pakage table
-- These fields enable package-specific exact departure date capsules

ALTER TABLE public."Pakage"
ADD COLUMN departure_dates JSONB DEFAULT '[]'::jsonb,
ADD COLUMN available_weekdays JSONB DEFAULT '[]'::jsonb;

-- Comment on columns for clarity
COMMENT ON COLUMN public."Pakage".departure_dates IS 'Array of exact ISO date strings (e.g. ["2026-08-24", "2026-08-29"]) for valid customer bookings.';
COMMENT ON COLUMN public."Pakage".available_weekdays IS 'Array of days (e.g. ["Thursday", "Friday"]) for admin convenience reference.';
