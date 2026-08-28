-- Migration: Add hero button category flags to Pakage table
-- DO NOT EXECUTE - FOR REVIEW ONLY

ALTER TABLE public."Pakage"
ADD COLUMN IF NOT EXISTS is_explore_all BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_upcoming BOOLEAN DEFAULT false;

COMMENT ON COLUMN public."Pakage".is_explore_all IS 'Flag to show package in Explore All Departures hero button link';
COMMENT ON COLUMN public."Pakage".is_upcoming IS 'Flag to show package in Upcoming Trips hero button link';
