BEGIN;

CREATE OR REPLACE FUNCTION public.sync_booking_travellers(
    p_booking_id UUID,
    p_travellers JSONB,
    p_primary_sharing_type TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_total_travellers INTEGER;
    v_expected_additional INTEGER;
    v_received_count INTEGER;
BEGIN
    IF p_booking_id IS NULL THEN
        RAISE EXCEPTION 'Booking ID is required.';
    END IF;

    IF p_travellers IS NULL
       OR jsonb_typeof(p_travellers) <> 'array' THEN
        RAISE EXCEPTION 'Travellers payload must be a JSON array.';
    END IF;

    SELECT b.travellers
    INTO v_total_travellers
    FROM public.bookings AS b
    WHERE b.id = p_booking_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Booking not found.';
    END IF;

    IF v_total_travellers IS NULL
       OR v_total_travellers < 1
       OR v_total_travellers > 15 THEN
        RAISE EXCEPTION 'Invalid booking traveller count.';
    END IF;

    v_expected_additional := v_total_travellers - 1;
    v_received_count := jsonb_array_length(p_travellers);

    IF v_received_count <> v_expected_additional THEN
        RAISE EXCEPTION
            'Additional traveller count mismatch. Expected %, received %.',
            v_expected_additional,
            v_received_count;
    END IF;

    -- Validate Primary Traveller sharing if provided
    IF p_primary_sharing_type IS NOT NULL AND p_primary_sharing_type NOT IN ('Quad Sharing', 'Triple Sharing', 'Double Sharing') THEN
        RAISE EXCEPTION 'Primary sharing type must be Quad Sharing, Triple Sharing, or Double Sharing.';
    END IF;

    -- Validate Additional Travellers
    IF EXISTS (
        SELECT 1
        FROM jsonb_array_elements(p_travellers) AS t
        WHERE jsonb_typeof(t) <> 'object'
           OR NULLIF(BTRIM(t->>'fullName'), '') IS NULL
           OR NULLIF(BTRIM(t->>'phone'), '') IS NULL
           OR NULLIF(BTRIM(t->>'email'), '') IS NULL
           OR BTRIM(t->>'email') !~ '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$'
           OR BTRIM(t->>'gender') NOT IN ('Male', 'Female', 'Other')
           OR BTRIM(t->>'sharingType') NOT IN ('Quad Sharing', 'Triple Sharing', 'Double Sharing')
    ) THEN
        RAISE EXCEPTION 'Each additional traveller must include full name, phone, a valid email format, gender (Male/Female/Other), and sharingType (Quad/Triple/Double).';
    END IF;

    -- Delete old additional travellers
    DELETE FROM public.booking_travellers AS bt
    WHERE bt.booking_id = p_booking_id
      AND bt.is_primary = false;

    -- Insert new additional travellers
    INSERT INTO public.booking_travellers (
        booking_id,
        full_name,
        phone,
        email,
        gender,
        sharing_type,
        is_primary
    )
    SELECT
        p_booking_id,
        BTRIM(t->>'fullName'),
        BTRIM(t->>'phone'),
        LOWER(BTRIM(t->>'email')),
        BTRIM(t->>'gender'),
        BTRIM(t->>'sharingType'),
        false
    FROM jsonb_array_elements(p_travellers) AS t;

    -- Update Primary Traveller sharing_type
    IF p_primary_sharing_type IS NOT NULL THEN
        UPDATE public.booking_travellers
        SET sharing_type = p_primary_sharing_type
        WHERE booking_id = p_booking_id
          AND is_primary = true;
    END IF;

END;
$$;

REVOKE ALL ON FUNCTION public.sync_booking_travellers(UUID, JSONB, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sync_booking_travellers(UUID, JSONB, TEXT) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_booking_travellers(UUID, JSONB, TEXT) TO service_role;

-- We drop the old 2-argument signature to prevent overload ambiguity.
DROP FUNCTION IF EXISTS public.sync_booking_travellers(UUID, JSONB);

COMMIT;
