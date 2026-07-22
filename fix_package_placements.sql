-- 1. Drop the table if it exists to fix any schema mismatch (e.g. placement_id as bigint instead of UUID)
DROP TABLE IF EXISTS public.package_placements CASCADE;

-- 2. Create package_placements table with correct schema
CREATE TABLE IF NOT EXISTS public.package_placements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    package_id bigint NOT NULL REFERENCES public."Pakage"(id) ON DELETE CASCADE,
    placement_type TEXT NOT NULL CHECK (placement_type IN ('homepage_section', 'interest', 'destination')),
    placement_id UUID NOT NULL,
    placement_slug TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Unique constraint to prevent duplicate placements for the same package
CREATE UNIQUE INDEX IF NOT EXISTS unique_package_placement ON public.package_placements (package_id, placement_type, placement_id);

-- 4. RLS Policies
ALTER TABLE public.package_placements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public SELECT package_placements" ON public.package_placements;
CREATE POLICY "Public SELECT package_placements" ON public.package_placements 
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin ALL package_placements" ON public.package_placements;
CREATE POLICY "Admin ALL package_placements" ON public.package_placements 
FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 5. Data Migration: Migrate existing packages into package_placements
DO $$
DECLARE
    pkg RECORD;
    cat TEXT;
    target_id UUID;
BEGIN
    FOR pkg IN SELECT id, listing_categories, destination, featured, best_seller FROM public."Pakage" LOOP
        
        -- Migrate categories (including featured and best_seller logic)
        IF pkg.listing_categories IS NOT NULL THEN
            FOR cat IN SELECT jsonb_array_elements_text(pkg.listing_categories) LOOP
                -- Try to find in homepage_sections
                SELECT id INTO target_id FROM public.homepage_sections WHERE section_key = cat LIMIT 1;
                IF FOUND THEN
                    INSERT INTO public.package_placements (package_id, placement_type, placement_id, placement_slug)
                    VALUES (pkg.id, 'homepage_section', target_id, cat)
                    ON CONFLICT DO NOTHING;
                ELSE
                    -- Try to find in interest_categories
                    SELECT id INTO target_id FROM public.interest_categories WHERE slug = cat LIMIT 1;
                    IF FOUND THEN
                        INSERT INTO public.package_placements (package_id, placement_type, placement_id, placement_slug)
                        VALUES (pkg.id, 'interest', target_id, cat)
                        ON CONFLICT DO NOTHING;
                    END IF;
                END IF;
            END LOOP;
        END IF;

        -- Migrate explicit featured/best_seller flags if they exist but weren't in listing_categories
        IF pkg.featured = true THEN
            SELECT id INTO target_id FROM public.homepage_sections WHERE section_key = 'recommended' LIMIT 1;
            IF FOUND THEN
                INSERT INTO public.package_placements (package_id, placement_type, placement_id, placement_slug)
                VALUES (pkg.id, 'homepage_section', target_id, 'recommended')
                ON CONFLICT DO NOTHING;
            END IF;
        END IF;

        IF pkg.best_seller = true THEN
            SELECT id INTO target_id FROM public.homepage_sections WHERE section_key = 'best-seller' LIMIT 1;
            IF FOUND THEN
                INSERT INTO public.package_placements (package_id, placement_type, placement_id, placement_slug)
                VALUES (pkg.id, 'homepage_section', target_id, 'best-seller')
                ON CONFLICT DO NOTHING;
            END IF;
        END IF;

        -- Migrate destination
        IF pkg.destination IS NOT NULL AND pkg.destination <> '' THEN
            SELECT id INTO target_id FROM public.destinations WHERE slug = pkg.destination LIMIT 1;
            IF FOUND THEN
                INSERT INTO public.package_placements (package_id, placement_type, placement_id, placement_slug)
                VALUES (pkg.id, 'destination', target_id, pkg.destination)
                ON CONFLICT DO NOTHING;
            END IF;
        END IF;
        
    END LOOP;
END $$;
