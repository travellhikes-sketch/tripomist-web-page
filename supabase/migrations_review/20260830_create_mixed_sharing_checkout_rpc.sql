BEGIN;

CREATE OR REPLACE FUNCTION public.create_or_update_checkout_booking_mixed(
    p_user_id UUID,
    p_package_id INTEGER,
    p_travel_date DATE,
    p_travellers INTEGER,
    p_selected_sharing TEXT,
    p_checkout_idempotency_key UUID,
    p_sharing_allocation JSONB,
    p_special_request TEXT DEFAULT NULL,
    p_source TEXT DEFAULT NULL,
    p_guest_name TEXT DEFAULT NULL,
    p_guest_phone TEXT DEFAULT NULL,
    p_guest_email TEXT DEFAULT NULL,
    p_checkout_lead_id UUID DEFAULT NULL
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

    v_quad_price NUMERIC(12, 2) := 0;
    v_triple_upgrade NUMERIC(12, 2) := 0;
    v_double_upgrade NUMERIC(12, 2) := 0;

    v_quad_count INTEGER := 0;
    v_triple_count INTEGER := 0;
    v_double_count INTEGER := 0;

    v_subtotal NUMERIC(12, 2) := 0;
    v_gst NUMERIC(12, 2) := 0;
    v_final_payable NUMERIC(12, 2) := 0;

    v_booking_id UUID;
    v_existing_booking RECORD;
    v_costing_item RECORD;
    v_key TEXT;
BEGIN
    -- 1. Validate inputs
    IF p_package_id IS NULL THEN
        RAISE EXCEPTION 'Package ID is required.';
    END IF;

    IF p_checkout_idempotency_key IS NULL THEN
        RAISE EXCEPTION 'Idempotency key is required.';
    END IF;

    IF p_travellers < 1 OR p_travellers > 15 THEN
        RAISE EXCEPTION 'Number of travellers must be between 1 and 15.';
    END IF;

    IF p_travel_date IS NULL OR p_travel_date <= CURRENT_DATE THEN
        RAISE EXCEPTION 'Travel date must be a future date.';
    END IF;

    -- Validate p_selected_sharing
    IF p_selected_sharing NOT IN ('Quad Sharing', 'Triple Sharing', 'Double Sharing') THEN
        RAISE EXCEPTION 'Invalid selected_sharing: must be Quad Sharing, Triple Sharing, or Double Sharing.';
    END IF;

    -- Validate p_sharing_allocation is mandatory
    IF p_sharing_allocation IS NULL OR jsonb_typeof(p_sharing_allocation) != 'object' THEN
        RAISE EXCEPTION 'sharing_allocation is mandatory and must be a JSON object.';
    END IF;

    FOR v_key IN SELECT jsonb_object_keys(p_sharing_allocation)
    LOOP
        IF v_key NOT IN ('Quad Sharing', 'Triple Sharing', 'Double Sharing') THEN
            RAISE EXCEPTION 'Unknown allocation key: %', v_key;
        END IF;
    END LOOP;

    v_quad_count := COALESCE((p_sharing_allocation->>'Quad Sharing')::INTEGER, 0);
    v_triple_count := COALESCE((p_sharing_allocation->>'Triple Sharing')::INTEGER, 0);
    v_double_count := COALESCE((p_sharing_allocation->>'Double Sharing')::INTEGER, 0);

    IF v_quad_count < 0 OR v_triple_count < 0 OR v_double_count < 0 THEN
        RAISE EXCEPTION 'Sharing counts cannot be negative.';
    END IF;

    IF (v_quad_count + v_triple_count + v_double_count) != p_travellers THEN
        RAISE EXCEPTION 'Sharing allocation sum must equal total travellers.';
    END IF;

    -- Fetch package and calculate prices BEFORE locking/returning early
    SELECT * INTO v_package FROM public."Pakage" WHERE id = p_package_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Package not found.'; END IF;
    IF v_package.status IS DISTINCT FROM 'active' THEN RAISE EXCEPTION 'Package is currently inactive.'; END IF;
    IF v_package.costings IS NULL OR jsonb_typeof(v_package.costings) IS DISTINCT FROM 'array' OR jsonb_array_length(v_package.costings) = 0 THEN RAISE EXCEPTION 'Package does not contain valid costings options.'; END IF;

    -- Parse Costings
    FOR v_costing_item IN SELECT * FROM jsonb_array_elements(v_package.costings) AS item LOOP
        DECLARE
            v_label TEXT := COALESCE(v_costing_item.item->>'type', v_costing_item.item->>'sharing', v_costing_item.item->>'sharing_type', v_costing_item.item->>'name', v_costing_item.item->>'title');
            v_price_val TEXT := v_costing_item.item->>'price';
            v_clean_price TEXT;
            v_numeric_val NUMERIC(12, 2) := 0;
        BEGIN
            IF v_label IS NOT NULL AND v_price_val IS NOT NULL THEN
                v_clean_price := REGEXP_REPLACE(v_price_val, '[₹,[:space:]]', '', 'g');
                v_clean_price := REGEXP_REPLACE(v_clean_price, 'perperson', '', 'gi');
                v_clean_price := TRIM(v_clean_price);
                IF v_clean_price ~ '^[0-9]+$' THEN
                    v_numeric_val := v_clean_price::NUMERIC;
                END IF;

                IF v_label = 'Quad Sharing' THEN v_quad_price := v_numeric_val;
                ELSIF v_label = 'Triple Sharing Upgrade' THEN v_triple_upgrade := v_numeric_val;
                ELSIF v_label = 'Double Sharing Upgrade' THEN v_double_upgrade := v_numeric_val;
                END IF;
            END IF;
        END;
    END LOOP;

    IF v_quad_price <= 0 THEN RAISE EXCEPTION 'Package configuration error: Quad Sharing is missing.'; END IF;
    IF (v_triple_count > 0 AND v_triple_upgrade <= 0) OR (v_double_count > 0 AND v_double_upgrade <= 0) THEN
        RAISE EXCEPTION 'Package configuration error: Missing required occupancy upgrades.';
    END IF;

    -- Calculate Subtotal
    v_subtotal := (v_quad_count * v_quad_price) +
                  (v_triple_count * (v_quad_price + v_triple_upgrade)) +
                  (v_double_count * (v_quad_price + v_double_upgrade));

    -- GST and Final Payable
    v_gst := ROUND(v_subtotal * 0.05, 2);
    v_final_payable := v_subtotal + v_gst;

    -- 2. Concurrency-safe advisory transaction lock
    PERFORM pg_advisory_xact_lock(hashtextextended(p_checkout_idempotency_key::text, 0));

    -- 3. Existing booking key search
    SELECT * INTO v_existing_booking FROM public.bookings WHERE checkout_idempotency_key = p_checkout_idempotency_key;

    IF FOUND THEN
        IF v_existing_booking.user_id IS DISTINCT FROM p_user_id OR v_existing_booking.checkout_lead_id IS DISTINCT FROM p_checkout_lead_id THEN
            RAISE EXCEPTION 'Idempotency conflict: key is already registered to a different user identity.';
        END IF;

        IF v_existing_booking.booking_status NOT IN ('new', 'contacted') OR v_existing_booking.payment_status IS DISTINCT FROM 'pending' THEN
            RAISE EXCEPTION 'Idempotency conflict: cannot mutate a paid or verified booking.';
        END IF;

        -- For strict idempotency response accuracy:
        -- Derive subtotal and gst from the saved final_payable_amount to ensure exact match even if package price drifted
        DECLARE
            v_saved_gst NUMERIC(12, 2) := ROUND(v_existing_booking.final_payable_amount - (v_existing_booking.final_payable_amount / 1.05), 2);
            v_saved_subtotal NUMERIC(12, 2) := v_existing_booking.final_payable_amount - v_saved_gst;
        BEGIN
            IF v_existing_booking.package_id IS NOT DISTINCT FROM p_package_id
               AND v_existing_booking.travel_date IS NOT DISTINCT FROM p_travel_date
               AND v_existing_booking.travellers IS NOT DISTINCT FROM p_travellers
               AND v_existing_booking.sharing_allocation::jsonb = p_sharing_allocation::jsonb
               AND v_existing_booking.special_request IS NOT DISTINCT FROM p_special_request THEN

                RETURN jsonb_build_object(
                    'success', true,
                    'booking_id', v_existing_booking.id,
                    'final_payable_amount', v_existing_booking.final_payable_amount,
                    'subtotal', v_saved_subtotal,
                    'gst', v_saved_gst,
                    'sharing_allocation', v_existing_booking.sharing_allocation,
                    'message', 'Booking already created.'
                );
            END IF;
        END;
    END IF;

    -- 4. Setup customer identity
    IF p_user_id IS NOT NULL THEN
        SELECT COALESCE(p.full_name, u.raw_user_meta_data->>'full_name'),
               CASE WHEN u.email_confirmed_at IS NOT NULL THEN u.email ELSE NULL END,
               COALESCE(CASE WHEN u.phone_confirmed_at IS NOT NULL THEN u.phone ELSE NULL END, p.phone)
        INTO v_customer_name, v_customer_email, v_customer_phone
        FROM auth.users u LEFT JOIN public.profiles p ON p.id = u.id WHERE u.id = p_user_id;

        IF v_customer_name IS NULL OR length(trim(v_customer_name)) = 0 THEN
            RAISE EXCEPTION 'Customer profile must contain a valid full name.';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id AND (email_confirmed_at IS NOT NULL OR phone_confirmed_at IS NOT NULL)) THEN
            RAISE EXCEPTION 'At least one contact method (email or phone) must be verified.';
        END IF;
    ELSE
        IF p_guest_name IS NULL OR length(trim(p_guest_name)) = 0 THEN RAISE EXCEPTION 'Guest checkout requires validated checkout lead full name.'; END IF;
        IF p_guest_phone IS NULL OR length(trim(p_guest_phone)) < 8 THEN RAISE EXCEPTION 'Guest checkout requires validated checkout lead contact phone.'; END IF;
        IF p_guest_email IS NULL OR p_guest_email !~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$' THEN RAISE EXCEPTION 'Guest checkout requires validated checkout lead email address.'; END IF;
        v_customer_name := trim(p_guest_name); v_customer_phone := trim(p_guest_phone); v_customer_email := trim(p_guest_email);
    END IF;

    IF v_existing_booking.id IS NOT NULL THEN
        UPDATE public.bookings SET
            customer_name = v_customer_name,
            phone = v_customer_phone,
            email = v_customer_email,
            package_id = p_package_id,
            package_title = v_package.title,
            destination = v_package.destination,
            travel_date = p_travel_date,
            travellers = p_travellers,
            selected_sharing = p_selected_sharing,
            sharing_allocation = p_sharing_allocation,
            total_amount = v_final_payable,
            final_amount = v_final_payable,
            amount_before_voucher = v_final_payable,
            final_payable_amount = v_final_payable,
            special_request = p_special_request,
            source = CASE WHEN p_source IS NULL OR length(trim(p_source)) = 0 THEN 'web' ELSE p_source END
        WHERE id = v_existing_booking.id;

        v_booking_id := v_existing_booking.id;

        UPDATE public.booking_travellers SET full_name = v_customer_name, phone = v_customer_phone, email = v_customer_email
        WHERE booking_id = v_booking_id AND is_primary = true;

        INSERT INTO public.booking_activity_logs (booking_id, action, field_name, new_value, changed_by)
        VALUES (v_booking_id, 'Checkout Details Updated Pre-payment', 'sharing_allocation', p_sharing_allocation::TEXT, p_user_id);
    ELSE
        INSERT INTO public.bookings (
            customer_name, phone, email, source, package_id, package_title, destination, travel_date,
            travellers, selected_sharing, sharing_allocation, total_amount, final_amount,
            amount_before_voucher, voucher_discount, final_payable_amount, checkout_idempotency_key,
            payment_status, booking_status, sales_channel, special_request, user_id, checkout_lead_id
        ) VALUES (
            v_customer_name, v_customer_phone, v_customer_email, CASE WHEN p_source IS NULL OR length(trim(p_source)) = 0 THEN 'web' ELSE p_source END,
            p_package_id, v_package.title, v_package.destination, p_travel_date, p_travellers, p_selected_sharing, p_sharing_allocation,
            v_final_payable, v_final_payable, v_final_payable, 0, v_final_payable, p_checkout_idempotency_key,
            'pending', 'new', 'unclassified', p_special_request, p_user_id, p_checkout_lead_id
        ) RETURNING id INTO v_booking_id;

        INSERT INTO public.booking_travellers (booking_id, full_name, phone, email, is_primary)
        VALUES (v_booking_id, v_customer_name, v_customer_phone, v_customer_email, true);

        INSERT INTO public.booking_activity_logs (booking_id, action, field_name, new_value, changed_by)
        VALUES (v_booking_id, 'Checkout Booking Created', 'booking_status', 'new', p_user_id);
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'booking_id', v_booking_id,
        'final_payable_amount', v_final_payable,
        'subtotal', v_subtotal,
        'gst', v_gst,
        'sharing_allocation', p_sharing_allocation
    );
END;
$$;

REVOKE ALL ON FUNCTION public.create_or_update_checkout_booking_mixed(UUID, INTEGER, DATE, INTEGER, TEXT, UUID, JSONB, TEXT, TEXT, TEXT, TEXT, TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_or_update_checkout_booking_mixed(UUID, INTEGER, DATE, INTEGER, TEXT, UUID, JSONB, TEXT, TEXT, TEXT, TEXT, TEXT, UUID) TO service_role;

COMMIT;