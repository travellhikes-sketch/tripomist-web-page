BEGIN;

-- CREATE TABLE IF NOT EXISTS
CREATE TABLE IF NOT EXISTS public.gallery_media (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    media_type text NOT NULL CHECK (media_type IN ('image', 'video')),
    media_url text NOT NULL,
    thumbnail_url text,
    title text,
    display_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for performance
CREATE INDEX IF NOT EXISTS gallery_media_active_order_idx ON public.gallery_media(is_active, display_order);

-- Trigger function set_gallery_media_updated_at
CREATE OR REPLACE FUNCTION public.set_gallery_media_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Guarded Trigger creation
DROP TRIGGER IF EXISTS update_gallery_media_updated_at ON public.gallery_media;
CREATE TRIGGER update_gallery_media_updated_at
    BEFORE UPDATE ON public.gallery_media
    FOR EACH ROW
    EXECUTE FUNCTION public.set_gallery_media_updated_at();

-- RLS Enable
ALTER TABLE public.gallery_media ENABLE ROW LEVEL SECURITY;

-- Guarded Policies creation
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'gallery_media' AND policyname = 'Anyone can read active gallery media'
    ) THEN
        CREATE POLICY "Anyone can read active gallery media"
            ON public.gallery_media
            FOR SELECT
            USING (is_active = true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'gallery_media' AND policyname = 'Admins can manage all gallery media'
    ) THEN
        CREATE POLICY "Admins can manage all gallery media"
            ON public.gallery_media
            FOR ALL
            TO authenticated
            USING (public.is_admin())
            WITH CHECK (public.is_admin());
    END IF;
END
$$;

COMMIT;
