-- ==========================================
-- BOOKING SYSTEM UPGRADE MIGRATION
-- ==========================================

-- 1. Create booking_travellers table
CREATE TABLE IF NOT EXISTS public.booking_travellers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL CHECK (trim(full_name) <> ''),
    phone TEXT,
    email TEXT,
    age INTEGER CHECK (age >= 0 AND age <= 120),
    gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer-not-to-say')),
    is_primary BOOLEAN DEFAULT false,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    id_type TEXT,
    id_number TEXT,
    notes TEXT,
    display_order INTEGER DEFAULT 0 CHECK (display_order >= 0),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Unique index to prevent duplicate primary traveller per booking
CREATE UNIQUE INDEX IF NOT EXISTS unique_primary_traveller ON public.booking_travellers (booking_id) WHERE is_primary = true;

DROP TRIGGER IF EXISTS trg_booking_travellers_updated_at ON public.booking_travellers;
CREATE TRIGGER trg_booking_travellers_updated_at BEFORE UPDATE ON public.booking_travellers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Safe Backfill: Create one primary traveller from existing bookings if no travellers exist
INSERT INTO public.booking_travellers (booking_id, full_name, phone, email, is_primary)
SELECT b.id, COALESCE(b.customer_name, 'Unknown Traveller'), b.customer_phone, b.customer_email, true
FROM public.bookings b
WHERE NOT EXISTS (
    SELECT 1 FROM public.booking_travellers bt WHERE bt.booking_id = b.id
) AND b.customer_name IS NOT NULL;


-- 2. Create booking_activity_logs table
CREATE TABLE IF NOT EXISTS public.booking_activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    field_name TEXT,
    old_value TEXT,
    new_value TEXT,
    changed_by UUID,
    changed_at TIMESTAMPTZ DEFAULT now(),
    note TEXT
);


-- 3. Create booking_rooms table
CREATE TABLE IF NOT EXISTS public.booking_rooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    room_number TEXT NOT NULL,
    room_type TEXT NOT NULL CHECK (room_type IN ('Double', 'Triple', 'Quad')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_booking_rooms_updated_at ON public.booking_rooms;
CREATE TRIGGER trg_booking_rooms_updated_at BEFORE UPDATE ON public.booking_rooms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- 4. Add room and future-ready fields to travellers
ALTER TABLE public.booking_travellers ADD COLUMN IF NOT EXISTS sharing_type TEXT;
ALTER TABLE public.booking_travellers ADD COLUMN IF NOT EXISTS room_id UUID REFERENCES public.booking_rooms(id) ON DELETE SET NULL;
ALTER TABLE public.booking_travellers ADD COLUMN IF NOT EXISTS bus_seat_number TEXT;
ALTER TABLE public.booking_travellers ADD COLUMN IF NOT EXISTS pickup_point TEXT;
ALTER TABLE public.booking_travellers ADD COLUMN IF NOT EXISTS check_in_status TEXT DEFAULT 'pending';

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'booking_travellers_sharing_type_check') THEN
        ALTER TABLE public.booking_travellers ADD CONSTRAINT booking_travellers_sharing_type_check CHECK (sharing_type IN ('Double', 'Triple', 'Quad'));
    END IF;
END $$;


-- 5. Row Level Security & Policies

ALTER TABLE public.booking_travellers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Customer Read Own Travellers" ON public.booking_travellers;
DROP POLICY IF EXISTS "Admin All - Booking Travellers" ON public.booking_travellers;
CREATE POLICY "Customer Read Own Travellers" ON public.booking_travellers 
  FOR SELECT USING (
    booking_id IN (SELECT id FROM public.bookings WHERE user_id = auth.uid())
  );
CREATE POLICY "Admin All - Booking Travellers" ON public.booking_travellers FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

ALTER TABLE public.booking_activity_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin All - Booking Activity Logs" ON public.booking_activity_logs;
CREATE POLICY "Admin All - Booking Activity Logs" ON public.booking_activity_logs FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

ALTER TABLE public.booking_rooms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Customer Read Own Rooms" ON public.booking_rooms;
DROP POLICY IF EXISTS "Admin All - Booking Rooms" ON public.booking_rooms;
CREATE POLICY "Customer Read Own Rooms" ON public.booking_rooms 
  FOR SELECT USING (booking_id IN (SELECT id FROM public.bookings WHERE user_id = auth.uid()));
CREATE POLICY "Admin All - Booking Rooms" ON public.booking_rooms FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 6. Package RLS Policies
ALTER TABLE public."Pakage" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public SELECT active packages" ON public."Pakage";
CREATE POLICY "Public SELECT active packages" ON public."Pakage" 
FOR SELECT USING (status = 'active');

DROP POLICY IF EXISTS "Admin SELECT all packages" ON public."Pakage";
CREATE POLICY "Admin SELECT all packages" ON public."Pakage" 
FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admin INSERT packages" ON public."Pakage";
CREATE POLICY "Admin INSERT packages" ON public."Pakage" 
FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin UPDATE packages" ON public."Pakage";
CREATE POLICY "Admin UPDATE packages" ON public."Pakage" 
FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin DELETE packages" ON public."Pakage";
CREATE POLICY "Admin DELETE packages" ON public."Pakage" 
FOR DELETE USING (public.is_admin());


-- 7. One-Time Migration: Backfill listing_categories from featured and best_seller
UPDATE public."Pakage"
SET listing_categories = (
  SELECT jsonb_agg(DISTINCT cat)
  FROM (
    SELECT jsonb_array_elements_text(COALESCE(listing_categories, '[]'::jsonb)) AS cat
    UNION
    SELECT 'recommended' WHERE featured = true
    UNION
    SELECT 'best-seller' WHERE best_seller = true
  ) AS unique_cats
)
WHERE featured = true OR best_seller = true;


-- 8. Create package_placements table
CREATE TABLE IF NOT EXISTS public.package_placements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    package_id UUID NOT NULL REFERENCES public."Pakage"(id) ON DELETE CASCADE,
    placement_type TEXT NOT NULL CHECK (placement_type IN ('homepage_section', 'interest', 'destination')),
    placement_id UUID NOT NULL,
    placement_slug TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Unique constraint to prevent duplicate placements for the same package
CREATE UNIQUE INDEX IF NOT EXISTS unique_package_placement ON public.package_placements (package_id, placement_type, placement_id);

-- RLS Policies
ALTER TABLE public.package_placements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public SELECT package_placements" ON public.package_placements;
CREATE POLICY "Public SELECT package_placements" ON public.package_placements 
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin ALL package_placements" ON public.package_placements;
CREATE POLICY "Admin ALL package_placements" ON public.package_placements 
FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Data Migration: Migrate existing listing_categories array and destinations
DO 
DECLARE
    pkg RECORD;
    cat TEXT;
    target_id UUID;
BEGIN
    FOR pkg IN SELECT id, listing_categories, destination FROM public."Pakage" LOOP
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

        IF pkg.destination IS NOT NULL AND pkg.destination <> '' THEN
            SELECT id INTO target_id FROM public.destinations WHERE slug = pkg.destination LIMIT 1;
            IF FOUND THEN
                INSERT INTO public.package_placements (package_id, placement_type, placement_id, placement_slug)
                VALUES (pkg.id, 'destination', target_id, pkg.destination)
                ON CONFLICT DO NOTHING;
            END IF;
        END IF;
    END LOOP;
END ;

