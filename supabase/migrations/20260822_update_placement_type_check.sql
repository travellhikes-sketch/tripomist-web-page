-- Migration: Update placement_type CHECK constraint to include recommendation_listing
-- This migration safely modifies the existing CHECK constraint on public.package_placements.
-- It drops the old constraint (found dynamically) and creates a new one with the full allowed set.
-- No data is altered.

DO $$
DECLARE
    cons_name TEXT;
BEGIN
    -- Find the existing CHECK constraint on placement_type
    SELECT con.conname INTO cons_name
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public'
      AND rel.relname = 'package_placements'
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) LIKE '%placement_type%';

    IF cons_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE public.package_placements DROP CONSTRAINT %I', cons_name);
        RAISE NOTICE 'Dropped existing constraint %', cons_name;
    END IF;

    -- Add the new CHECK constraint with all allowed values
    EXECUTE $$
        ALTER TABLE public.package_placements
        ADD CONSTRAINT placement_type_allowed CHECK (
            placement_type IN (
                'homepage_section',
                'destination',
                'interest',
                'explore',
                'explore_department',
                'promo',
                'promo_strip',
                'recommendation_destination',
                'recommendation_interest',
                'recommendation_listing'
            )
        );
    $$;
    RAISE NOTICE 'Added new placement_type_allowed constraint with recommendation_listing.';
END $$;
