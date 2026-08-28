-- Migration to add email to itinerary_download_leads
-- Using NULL for backward compatibility with existing leads that were created before email was required

ALTER TABLE public.itinerary_download_leads 
ADD COLUMN IF NOT EXISTS email text NULL;
