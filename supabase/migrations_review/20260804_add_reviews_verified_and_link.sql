BEGIN;

-- Add optional verified indicator (default false) and read-more link to public.reviews table
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS verified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS read_more_link text;

COMMIT;
