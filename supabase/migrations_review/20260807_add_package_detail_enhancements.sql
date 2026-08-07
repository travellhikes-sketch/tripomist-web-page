-- Migration: Add enhanced fields for Package Detail page (gallery, PDF, things to carry, notes)
-- Note: Do NOT auto-execute; per user instruction, report requirement and create file only.

BEGIN;

ALTER TABLE public."Pakage"
  ADD COLUMN IF NOT EXISTS gallery_images jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS things_to_carry jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS itinerary_pdf_url text,
  ADD COLUMN IF NOT EXISTS section_settings jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS trip_info jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS trust_benefits jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS faqs jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS download_block jsonb DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public."Pakage".gallery_images IS 'JSON array of additional gallery image URLs for multi-photo Lightbox';
COMMENT ON COLUMN public."Pakage".things_to_carry IS 'JSON array or string list of items to carry for the package';
COMMENT ON COLUMN public."Pakage".notes IS 'Important notes, age guidelines, and cancellation policy highlights';
COMMENT ON COLUMN public."Pakage".itinerary_pdf_url IS 'Direct URL to downloadable package PDF itinerary';
COMMENT ON COLUMN public."Pakage".section_settings IS 'JSON array of section ordering and visibility controls';
COMMENT ON COLUMN public."Pakage".trip_info IS 'JSON array of trip info items (icon, label, value)';
COMMENT ON COLUMN public."Pakage".trust_benefits IS 'JSON array of package trust benefit points (e.g., Best for Solo Travelers)';
COMMENT ON COLUMN public."Pakage".faqs IS 'JSON array of FAQ items (question, answer)';
COMMENT ON COLUMN public."Pakage".download_block IS 'JSON object of custom download block titles and subtext';

COMMIT;
