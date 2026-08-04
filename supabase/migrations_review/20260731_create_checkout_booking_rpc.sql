BEGIN;

-- ============================================================================
-- TripoMist: Secure Checkout Booking Creation (Service Role Only)
-- File:    20260731_create_checkout_booking_rpc.sql
-- Status:  REVIEW DRAFT
-- Author:  Schema Audit 2026-07-31
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_checkout_booking(
    p_user_id UUID,
    p_package_id INTEGER,
    p_travel_date DATE,
    p_travellers INTEGER,
    p_selected_sharing TEXT,
    p_checkout_idempotency_key UUID,
    p_special_request TEXT DEFAULT NULL,
    p_source TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_customer_name TEXT;
    v_customer_email TEXT;
    v_customer_phone TEXT;
    
    v_package RECORD;
    v_costing_item RECORD;
    v_costing_found BOOLEAN := false;
    v_price_per_person NUMERIC(12, 2);
    
    v_subtotal NUMERIC(12, 2);
    v_gst NUMERIC(12, 2);
    v_final_payable NUMERIC(12, 2);
    
    v_booking_id UUID;
    v_existing_booking RECORD;
    v_canonical_sharing TEXT;
BEGIN
    -- 1. Validate inputs
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'User ID is required.';
    END IF;

    IF p_package_id IS NULL THEN
        RAISE EXCEPTION 'Package ID is required.';
    END IF;

    IF p_selected_sharing IS NULL OR length(trim(p_selected_sharing)) = 0 THEN
        RAISE EXCEPTION 'Selected sharing type is required.';
    END IF;

    IF p_checkout_idempotency_key IS NULL THEN
        RAISE EXCEPTION 'Idempotency key is required.';
    END IF;

    -- 2. Concurrency-safe advisory transaction lock
    PERFORM pg_advisory_xact_lock(
      hashtextextended(p_checkout_idempotency_key::text, 0)
    );

    -- 3. Existing booking key search (user filter excluded)
    SELECT * INTO v_existing_booking 
    FROM public.bookings 
    WHERE checkout_idempotency_key = p_checkout_idempotency_key;

    IF FOUND THEN
        -- 4. Require user_id, package_id, travel_date, travellers, selected_sharing equality (case-insensitive & trimmed for sharing)
        IF v_existing_booking.user_id IS DISTINCT FROM p_user_id
           OR v_existing_booking.package_id IS DISTINCT FROM p_package_id
           OR v_existing_booking.travel_date IS DISTINCT FROM p_travel_date
           OR v_existing_booking.travellers IS DISTINCT FROM p_travellers
           OR LOWER(TRIM(v_existing_booking.selected_sharing)) IS DISTINCT FROM LOWER(TRIM(p_selected_sharing)) THEN
            RAISE EXCEPTION 'Idempotency conflict: key is already registered with different checkout parameters.';
        END IF;

        -- 5. Return stored booking amount
        RETURN jsonb_build_object(
            'success', true,
            'booking_id', v_existing_booking.id,
            'final_payable_amount', v_existing_booking.final_payable_amount,
            'message', 'Booking already created.'
        );
    END IF;

    -- Fetch customer details from profile & auth metadata securely
    -- 1. Confirmed auth email/phone preferred; at least one confirmed auth contact required
    -- profile.phone can be saved as contact fallback
    SELECT 
        COALESCE(p.full_name, u.raw_user_meta_data->>'full_name') AS full_name,
        CASE WHEN u.email_confirmed_at IS NOT NULL THEN u.email ELSE NULL END AS email,
        COALESCE(CASE WHEN u.phone_confirmed_at IS NOT NULL THEN u.phone ELSE NULL END, p.phone) AS phone
    INTO v_customer_name, v_customer_email, v_customer_phone
    FROM auth.users u
    LEFT JOIN public.profiles p ON p.id = u.id
    WHERE u.id = p_user_id;

    IF v_customer_name IS NULL OR length(trim(v_customer_name)) = 0 THEN
        RAISE EXCEPTION 'Customer profile must contain a valid full name.';
    END IF;

    -- Require at least one confirmed auth contact
    -- Confirmed auth contacts are: auth.email (when email_confirmed_at IS NOT NULL) OR auth.phone (when phone_confirmed_at IS NOT NULL)
    IF NOT EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = p_user_id 
          AND (email_confirmed_at IS NOT NULL OR phone_confirmed_at IS NOT NULL)
    ) THEN
        RAISE EXCEPTION 'At least one contact method (email or phone) must be verified.';
    END IF;

    -- Fetch package; status active is required
    SELECT * INTO v_package FROM public."Pakage" WHERE id = p_package_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Package not found.';
    END IF;

    IF v_package.status IS DISTINCT FROM 'active' THEN
        RAISE EXCEPTION 'Package is currently inactive.';
    END IF;

    -- travellers 1–50 check
    IF p_travellers IS NULL OR p_travellers < 1 OR p_travellers > 50 THEN
        RAISE EXCEPTION 'Number of travellers must be between 1 and 50.';
    END IF;

    -- Future travel date required
    IF p_travel_date IS NULL OR p_travel_date <= CURRENT_DATE THEN
        RAISE EXCEPTION 'Travel date must be a future date.';
    END IF;

    -- Match selected_sharing to costings JSONB array
    IF p_selected_sharing NOT IN ('Quad Sharing', 'Triple Sharing', 'Double Sharing') THEN
        RAISE EXCEPTION 'Invalid occupancy sharing type. Must be Quad Sharing, Triple Sharing, or Double Sharing.';
    END IF;

    IF v_package.costings IS NULL OR jsonb_typeof(v_package.costings) IS DISTINCT FROM 'array' OR jsonb_array_length(v_package.costings) = 0 THEN
        RAISE EXCEPTION 'Package does not contain valid costings options.';
    END IF;

    -- Fetch Quad Sharing base price
    DECLARE
        v_quad_record RECORD;
        v_quad_found BOOLEAN := false;
        v_quad_price NUMERIC(12, 2) := 0;
        v_upgrade_val NUMERIC(12, 2) := 0;
        v_upgrade_record RECORD;
    BEGIN
        -- Find Quad Sharing base
        FOR v_quad_record IN SELECT * FROM jsonb_to_recordset(v_package.costings) AS x(type TEXT, price TEXT) LOOP
            IF v_quad_record.type = 'Quad Sharing' THEN
                DECLARE
                    v_clean_price TEXT;
                BEGIN
                    v_clean_price := REGEXP_REPLACE(v_quad_record.price, '[₹,[:space:]]', '', 'g');
                    v_clean_price := REGEXP_REPLACE(v_clean_price, 'perperson', '', 'gi');
                    v_clean_price := TRIM(v_clean_price);
                    IF v_clean_price ~ '^[0-9]+$' THEN
                        v_quad_price := v_clean_price::NUMERIC;
                        v_quad_found := true;
                    END IF;
                EXCEPTION WHEN OTHERS THEN
                    NULL;
                END;
            END IF;
        END LOOP;

        IF NOT v_quad_found OR v_quad_price <= 0 THEN
            RAISE EXCEPTION 'Package configuration error: Quad Sharing is missing.';
        END IF;

        IF p_selected_sharing = 'Quad Sharing' THEN
            v_price_per_person := v_quad_price;
        ELSE
            -- Find Upgrade cost costing item
            -- Looking for either 'Triple Sharing Upgrade' or 'Double Sharing Upgrade'
            -- We never show the word Upgrade to the customer in label, but costings database row matches the requested upgrade names.
            DECLARE
                v_upgrade_name TEXT;
            BEGIN
                IF p_selected_sharing = 'Triple Sharing' THEN
                    v_upgrade_name := 'Triple Sharing Upgrade';
                ELSIF p_selected_sharing = 'Double Sharing' THEN
                    v_upgrade_name := 'Double Sharing Upgrade';
                END IF;

                FOR v_upgrade_record IN SELECT * FROM jsonb_to_recordset(v_package.costings) AS x(type TEXT, price TEXT) LOOP
                    IF v_upgrade_record.type = v_upgrade_name THEN
                        DECLARE
                            v_clean_price TEXT;
                        BEGIN
                            v_clean_price := REGEXP_REPLACE(v_upgrade_record.price, '[₹,[:space:]]', '', 'g');
                            v_clean_price := REGEXP_REPLACE(v_clean_price, 'perperson', '', 'gi');
                            v_clean_price := TRIM(v_clean_price);
                            IF v_clean_price ~ '^[0-9]+$' THEN
                                v_upgrade_val := v_clean_price::NUMERIC;
                                v_costing_found := true;
                            END IF;
                        EXCEPTION WHEN OTHERS THEN
                            NULL;
                        END;
                    END IF;
                END LOOP;

                IF NOT v_costing_found THEN
                    RAISE EXCEPTION 'Sharing option upgrade costing % is not offered on this package.', v_upgrade_name;
                END IF;

                v_price_per_person := v_quad_price + v_upgrade_val;
            END;
        END IF;
    END;

    IF v_price_per_person IS NULL OR v_price_per_person <= 0 THEN
        RAISE EXCEPTION 'Invalid price per person calculated.';
    END IF;

    -- Server calculate: subtotal, GST, and final total
    v_subtotal := v_price_per_person * p_travellers;
    v_gst := ROUND(v_subtotal * 0.05, 2);
    v_final_payable := v_subtotal + v_gst;

    -- Insert pending/new booking with zero coupon
    -- Using actual booking columns requested
    -- 9. Null/blank source gets set to 'web'
    INSERT INTO public.bookings (
        customer_name,
        phone,
        email,
        source,
        package_id,
        package_title,
        destination,
        travel_date,
        travellers,
        selected_sharing,
        total_amount,
        final_amount,
        amount_before_voucher,
        voucher_discount,
        final_payable_amount,
        checkout_idempotency_key,
        payment_status,
        booking_status,
        sales_channel,
        special_request,
        user_id
    ) VALUES (
        v_customer_name,
        v_customer_phone,
        v_customer_email,
        CASE WHEN p_source IS NULL OR length(trim(p_source)) = 0 THEN 'web' ELSE p_source END,
        p_package_id,
        v_package.title,
        v_package.destination,
        p_travel_date,
        p_travellers,
        v_canonical_sharing,
        v_final_payable,
        v_final_payable,
        v_final_payable,
        0,
        v_final_payable,
        p_checkout_idempotency_key,
        'pending',
        'new',
        'unclassified',
        p_special_request,
        p_user_id
    ) RETURNING id INTO v_booking_id;

    -- Create primary traveller record matching PackageCheckout.jsx structure
    INSERT INTO public.booking_travellers (
        booking_id,
        full_name,
        phone,
        email,
        is_primary
    ) VALUES (
        v_booking_id,
        v_customer_name,
        v_customer_phone,
        v_customer_email,
        true
    );

    -- Log booking created
    INSERT INTO public.booking_activity_logs (
        booking_id,
        action,
        field_name,
        new_value,
        changed_by
    ) VALUES (
        v_booking_id,
        'Checkout Booking Created',
        'booking_status',
        'new',
        p_user_id
    );

    RETURN jsonb_build_object(
        'success', true,
        'booking_id', v_booking_id,
        'final_payable_amount', v_final_payable
    );
END;
$$;

-- Update REVOKE/GRANT function signature
REVOKE EXECUTE ON FUNCTION public.create_checkout_booking(UUID, INTEGER, DATE, INTEGER, TEXT, UUID, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_checkout_booking(UUID, INTEGER, DATE, INTEGER, TEXT, UUID, TEXT, TEXT) TO service_role;

COMMIT;
