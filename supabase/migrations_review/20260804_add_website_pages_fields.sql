BEGIN;

-- Add optional mobile banner field for premium page template
ALTER TABLE public.website_pages
ADD COLUMN IF NOT EXISTS mobile_banner_image TEXT;

COMMIT;
