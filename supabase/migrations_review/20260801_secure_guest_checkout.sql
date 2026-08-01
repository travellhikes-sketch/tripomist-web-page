BEGIN;

-- Additive migration for secure guest checkout support
-- Make user_id nullable on bookings table (it should already be nullable, but we guarantee it)
ALTER TABLE public.bookings ALTER COLUMN user_id DROP NOT NULL;

-- Add checkout_lead_id reference column to bookings table
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS checkout_lead_id UUID REFERENCES public.checkout_leads(id) ON DELETE SET NULL;

-- Make user_id nullable on payment_attempts table for guest checkout
ALTER TABLE public.payment_attempts ALTER COLUMN user_id DROP NOT NULL;

-- Add checkout_lead_id reference column to payment_attempts table
ALTER TABLE public.payment_attempts ADD COLUMN IF NOT EXISTS checkout_lead_id UUID REFERENCES public.checkout_leads(id) ON DELETE SET NULL;

-- Add mutual exclusivity checks (either user_id or checkout_lead_id must be populated, but not both)
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS check_bookings_user_or_lead_exclusivity;
ALTER TABLE public.bookings ADD CONSTRAINT check_bookings_user_or_lead_exclusivity
  CHECK (
    (user_id IS NOT NULL AND checkout_lead_id IS NULL)
    OR
    (user_id IS NULL AND checkout_lead_id IS NOT NULL)
  );

ALTER TABLE public.payment_attempts DROP CONSTRAINT IF EXISTS check_payment_attempts_user_or_lead_exclusivity;
ALTER TABLE public.payment_attempts ADD CONSTRAINT check_payment_attempts_user_or_lead_exclusivity
  CHECK (
    (user_id IS NOT NULL AND checkout_lead_id IS NULL)
    OR
    (user_id IS NULL AND checkout_lead_id IS NOT NULL)
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookings_checkout_lead_id ON public.bookings(checkout_lead_id);
CREATE INDEX IF NOT EXISTS idx_payment_attempts_checkout_lead_id ON public.payment_attempts(checkout_lead_id);

-- Add lead_token_hash to checkout_leads for hash-based checks
ALTER TABLE public.checkout_leads ADD COLUMN IF NOT EXISTS lead_token_hash TEXT;

-- Update existing hashed values for compatibility
UPDATE public.checkout_leads 
SET lead_token_hash = encode(digest(lead_token, 'sha256'), 'hex')
WHERE lead_token_hash IS NULL AND lead_token IS NOT NULL;

-- Guest lead rate limiting infrastructure
CREATE TABLE IF NOT EXISTS public.guest_lead_rate_limit (
    hashed_ip TEXT NOT NULL,
    hashed_contact TEXT NOT NULL,
    last_used TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT guest_lead_rate_limit_hash_len CHECK (length(hashed_ip) = 64 AND length(hashed_contact) = 64),
    CONSTRAINT guest_lead_rate_limit_unique UNIQUE (hashed_ip, hashed_contact)
);

-- RPC to atomically consume a lead rate limit slot
CREATE OR REPLACE FUNCTION public.consume_guest_lead_rate_limit(
    p_ip_hash TEXT,
    p_contact_hash TEXT
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_now TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
    IF length(p_ip_hash) <> 64 OR length(p_contact_hash) <> 64 THEN
        RAISE EXCEPTION 'Invalid hash length (must be 64 characters).';
    END IF;
    -- Insert or update the usage timestamp atomically
    INSERT INTO public.guest_lead_rate_limit (hashed_ip, hashed_contact, last_used)
    VALUES (p_ip_hash, p_contact_hash, v_now)
    ON CONFLICT (hashed_ip, hashed_contact) DO UPDATE
        SET last_used = EXCLUDED.last_used;
    -- Enforce IP limit: max 5 uses per 10 minutes
    IF (SELECT count(*) FROM public.guest_lead_rate_limit
        WHERE hashed_ip = p_ip_hash AND last_used > v_now - INTERVAL '10 minutes') > 5 THEN
        RAISE EXCEPTION 'IP rate limit exceeded.';
    END IF;
    -- Enforce contact limit: max 1 use per 5 minutes
    IF (SELECT count(*) FROM public.guest_lead_rate_limit
        WHERE hashed_contact = p_contact_hash AND last_used > v_now - INTERVAL '5 minutes') > 1 THEN
        RAISE EXCEPTION 'Contact rate limit exceeded.';
    END IF;
END;
$$;

-- Backfill hash for existing leads and clear raw token values
UPDATE public.checkout_leads
SET lead_token_hash = encode(digest(lead_token, 'sha256'), 'hex')
WHERE lead_token_hash IS NULL AND lead_token IS NOT NULL;

UPDATE public.checkout_leads
SET lead_token = NULL
WHERE lead_token IS NOT NULL;

-- Unique partial index on lead_token_hash for fast lookup
CREATE UNIQUE INDEX IF NOT EXISTS idx_checkout_leads_token_hash ON public.checkout_leads (lead_token_hash) WHERE lead_token_hash IS NOT NULL;

-- Update create_checkout_booking to handle guest checkouts, checkout_lead_id bindings, and verified guest identities
DROP FUNCTION IF EXISTS public.create_checkout_booking(UUID, INTEGER, DATE, INTEGER, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.prepare_payment_attempt(UUID, UUID);

CREATE OR REPLACE FUNCTION public.create_checkout_booking(
    p_user_id UUID,
    p_package_id INTEGER,
    p_travel_date DATE,
    p_travellers INTEGER,
    p_selected_sharing TEXT,
    p_checkout_idempotency_key UUID,
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

    -- 3. Existing booking key search with mandatory user_id & checkout_lead_id equality checks
    SELECT * INTO v_existing_booking 
    FROM public.bookings 
    WHERE checkout_idempotency_key = p_checkout_idempotency_key;

    IF FOUND THEN
        -- Require parameters and owner identities (user_id and checkout_lead_id) match
        IF v_existing_booking.user_id IS DISTINCT FROM p_user_id
           OR v_existing_booking.checkout_lead_id IS DISTINCT FROM p_checkout_lead_id
           OR v_existing_booking.package_id IS DISTINCT FROM p_package_id
           OR v_existing_booking.travel_date IS DISTINCT FROM p_travel_date
           OR v_existing_booking.travellers IS DISTINCT FROM p_travellers
           OR LOWER(TRIM(v_existing_booking.selected_sharing)) IS DISTINCT FROM LOWER(TRIM(p_selected_sharing)) THEN
            RAISE EXCEPTION 'Idempotency conflict: key is already registered with different checkout parameters.';
        END IF;

        -- Return stored booking amount
        RETURN jsonb_build_object(
            'success', true,
            'booking_id', v_existing_booking.id,
            'final_payable_amount', v_existing_booking.final_payable_amount,
            'message', 'Booking already created.'
        );
    END IF;

    -- 4. Setup customer identity details
    IF p_user_id IS NOT NULL THEN
        -- Fetch customer details from profile & auth metadata securely
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
        IF NOT EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = p_user_id 
              AND (email_confirmed_at IS NOT NULL OR phone_confirmed_at IS NOT NULL)
        ) THEN
            RAISE EXCEPTION 'At least one contact method (email or phone) must be verified.';
        END IF;
    ELSE
        -- Guest user identity: Trust ONLY verified lead parameters
        IF p_guest_name IS NULL OR length(trim(p_guest_name)) = 0 THEN
            RAISE EXCEPTION 'Guest checkout requires validated checkout lead full name.';
        END IF;
        IF p_guest_phone IS NULL OR length(trim(p_guest_phone)) < 8 THEN
            RAISE EXCEPTION 'Guest checkout requires validated checkout lead contact phone.';
        END IF;
        IF p_guest_email IS NULL OR p_guest_email !~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$' THEN
            RAISE EXCEPTION 'Guest checkout requires validated checkout lead email address.';
        END IF;

        v_customer_name := trim(p_guest_name);
        v_customer_phone := trim(p_guest_phone);
        v_customer_email := trim(p_guest_email);
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

    -- Fetch Quad Sharing base price & Upgrades
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

                IF NOT v_costing_found OR v_upgrade_val <= 0 THEN
                    RAISE EXCEPTION 'Sharing option upgrade costing % is missing or zero.', v_upgrade_name;
                END IF;

                v_price_per_person := v_quad_price + v_upgrade_val;
            END;
        END IF;
    END;

    IF v_price_per_person IS NULL OR v_price_per_person <= 0 THEN
        RAISE EXCEPTION 'Invalid price per person calculated.';
    END IF;

    -- Calculate subtotal, GST, and final total
    v_subtotal := v_price_per_person * p_travellers;
    v_gst := ROUND(v_subtotal * 0.05, 2);
    v_final_payable := v_subtotal + v_gst;

    -- Insert new booking
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
        user_id,
        checkout_lead_id
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
        p_selected_sharing,
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
        p_user_id,
        p_checkout_lead_id
    ) RETURNING id INTO v_booking_id;

    -- Create traveller record
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

-- Restored secure prepare_payment_attempt with guest support, 'REC-' + full idempotency UUID, and claim_expires_at/expires_at limits
CREATE OR REPLACE FUNCTION public.prepare_payment_attempt(
    p_booking_id UUID,
    p_idempotency_key UUID,
    p_checkout_lead_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_booking RECORD;
    v_reservation RECORD;
    v_attempt RECORD;
    v_expected_amount_paise BIGINT;
    v_receipt TEXT;
BEGIN
    -- 1. Validate inputs
    IF p_booking_id IS NULL OR p_idempotency_key IS NULL THEN
        RAISE EXCEPTION 'Booking ID and Idempotency key are required.';
    END IF;

    -- 2. Lock booking
    SELECT * INTO v_booking FROM public.bookings WHERE id = p_booking_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Booking not found.';
    END IF;

    -- Enforce booking security checks: status must be new or contacted, payment status must be pending
    IF v_booking.booking_status IS DISTINCT FROM 'new' AND v_booking.booking_status IS DISTINCT FROM 'contacted' THEN
        RAISE EXCEPTION 'Booking status must be new or contacted.';
    END IF;

    IF v_booking.payment_status IS DISTINCT FROM 'pending' THEN
        RAISE EXCEPTION 'Booking payment status must be pending.';
    END IF;

    IF v_booking.final_payable_amount IS NULL OR v_booking.final_payable_amount <= 0 THEN
        RAISE EXCEPTION 'final_payable_amount must be populated and greater than zero.';
    END IF;

    IF v_booking.checkout_idempotency_key IS DISTINCT FROM p_idempotency_key THEN
        RAISE EXCEPTION 'Idempotency key mismatch with booking record.';
    END IF;

    -- Enforce checkout lead ownership: p_checkout_lead_id must match the booking
    IF p_checkout_lead_id IS DISTINCT FROM v_booking.checkout_lead_id THEN
        RAISE EXCEPTION 'Checkout lead ID mismatch.';
    END IF;

    -- 3. Check for existing payment attempt by idempotency key
    SELECT * INTO v_attempt FROM public.payment_attempts WHERE idempotency_key = p_idempotency_key FOR UPDATE;
    IF FOUND THEN
        -- If already verified, failed, cancelled, or expired, reject new attempt with same key
        IF v_attempt.status IN ('verified', 'failed', 'cancelled', 'expired') THEN
            RAISE EXCEPTION 'Payment attempt already finalized or invalidated with status: %', v_attempt.status;
        END IF;

        IF v_attempt.booking_id IS DISTINCT FROM p_booking_id THEN
            RAISE EXCEPTION 'Idempotency key belongs to another booking.';
        END IF;

        IF v_attempt.user_id IS DISTINCT FROM v_booking.user_id OR v_attempt.checkout_lead_id IS DISTINCT FROM v_booking.checkout_lead_id THEN
            RAISE EXCEPTION 'Payment attempt ownership mismatch.';
        END IF;

        -- Return existing active payment attempt details
        RETURN jsonb_build_object(
            'success', true,
            'payment_attempt_id', v_attempt.id,
            'receipt', v_attempt.receipt,
            'expected_amount_paise', v_attempt.expected_amount_paise,
            'razorpay_order_id', v_attempt.razorpay_order_id,
            'status', v_attempt.status
        );
    END IF;

    -- Ensure a coupon has been locked if reservation exists
    SELECT * INTO v_reservation 
    FROM public.voucher_reservations 
    WHERE booking_id = p_booking_id 
      AND status = 'pending'
    LIMIT 1;

    IF v_booking.voucher_id IS NOT NULL OR COALESCE(v_booking.voucher_discount, 0) > 0 THEN
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Voucher fields populated on booking but no active reservation found.';
        END IF;
        
        -- Validate coupon reservation ownership, amount, voucher_id and expiry
        IF v_reservation.user_id IS DISTINCT FROM v_booking.user_id THEN
            RAISE EXCEPTION 'Voucher reservation owner mismatch.';
        END IF;
        IF v_reservation.reserved_amount IS DISTINCT FROM v_booking.voucher_discount THEN
            RAISE EXCEPTION 'Voucher reservation discount amount mismatch.';
        END IF;
        IF v_reservation.voucher_id IS DISTINCT FROM v_booking.voucher_id THEN
            RAISE EXCEPTION 'Voucher ID mismatch between reservation and booking.';
        END IF;
        IF v_reservation.expires_at <= NOW() THEN
            RAISE EXCEPTION 'Voucher reservation has expired.';
        END IF;
    ELSE
        -- If booking has no voucher, but a pending reservation was somehow found, reject it
        IF FOUND THEN
            RAISE EXCEPTION 'A pending voucher reservation exists, but booking has no voucher attached.';
        END IF;

        -- Without coupon require voucher_discount = 0 and final_payable_amount = amount_before_voucher
        IF COALESCE(v_booking.voucher_discount, 0) IS DISTINCT FROM 0 THEN
            RAISE EXCEPTION 'No voucher attached, discount must be zero.';
        END IF;
        IF v_booking.final_payable_amount IS DISTINCT FROM v_booking.amount_before_voucher THEN
            RAISE EXCEPTION 'No voucher attached, final payable must equal amount before voucher.';
        END IF;
    END IF;

    -- 4. Check if booking already has another active attempt
    PERFORM id FROM public.payment_attempts 
    WHERE booking_id = p_booking_id 
      AND status IN ('preparing', 'order_created', 'verification_pending')
    LIMIT 1;
    IF FOUND THEN
        RAISE EXCEPTION 'An active payment attempt is already in progress for this booking.';
    END IF;

    -- 5. Calculate expected amount in paise from database fields
    v_expected_amount_paise := (v_booking.final_payable_amount * 100)::BIGINT;

    -- 6. Generate receipt as 'REC-' + full idempotency UUID (removing hyphens)
    v_receipt := 'REC-' || UPPER(REPLACE(p_idempotency_key::text, '-', ''));

    -- 7. Insert payment attempt in 'preparing' status with expires_at & claim_expires_at (10 minutes)
    INSERT INTO public.payment_attempts (
        user_id,
        checkout_lead_id,
        booking_id,
        reservation_id,
        idempotency_key,
        receipt,
        expected_amount_paise,
        currency,
        status,
        claim_token,
        claim_expires_at,
        expires_at
    ) VALUES (
        v_booking.user_id,
        v_booking.checkout_lead_id,
        p_booking_id,
        CASE WHEN v_booking.voucher_id IS NOT NULL AND v_reservation.id IS NOT NULL THEN v_reservation.id ELSE NULL END,
        p_idempotency_key,
        v_receipt,
        v_expected_amount_paise,
        'INR',
        'preparing',
        gen_random_uuid(),
        NOW() + INTERVAL '10 minutes',
        NOW() + INTERVAL '10 minutes'
    ) RETURNING * INTO v_attempt;

    -- Log activity
    INSERT INTO public.booking_activity_logs (
        booking_id, action, field_name, new_value, changed_by
    ) VALUES (
        p_booking_id, 'Payment Attempt Prepared', 'payment_attempt_id', v_attempt.id::text, v_booking.user_id
    );

    RETURN jsonb_build_object(
        'success', true,
        'payment_attempt_id', v_attempt.id,
        'receipt', v_attempt.receipt,
        'expected_amount_paise', v_attempt.expected_amount_paise,
        'claim_token', v_attempt.claim_token,
        'status', 'preparing'
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_checkout_booking(UUID, INTEGER, DATE, INTEGER, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_checkout_booking(UUID, INTEGER, DATE, INTEGER, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, UUID) TO service_role;

REVOKE EXECUTE ON FUNCTION public.prepare_payment_attempt(UUID, UUID, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prepare_payment_attempt(UUID, UUID, UUID) TO service_role;

-- Lead RPCs are service_role-only; Edge actions proxy them on behalf of guests

DROP FUNCTION IF EXISTS public.create_checkout_lead(
    TEXT, TEXT, TEXT, BIGINT, TEXT, TEXT,
    DATE, INTEGER, TEXT, NUMERIC, TEXT, TEXT, TEXT
);

-- Secure create_checkout_lead RPC (stores only token hash)
CREATE OR REPLACE FUNCTION public.create_checkout_lead(
    p_customer_name TEXT,
    p_phone TEXT,
    p_email TEXT,
    p_package_id BIGINT,
    p_package_title TEXT,
    p_destination TEXT,
    p_travel_date DATE,
    p_travellers INTEGER,
    p_selected_sharing TEXT,
    p_estimated_amount NUMERIC,
    p_source TEXT,
    p_special_request TEXT,
    p_lead_token_hash TEXT
)
RETURNS TABLE (
    id UUID,
    lead_number TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF p_customer_name IS NULL OR length(trim(p_customer_name)) < 2 THEN
        RAISE EXCEPTION 'Valid customer name is required.';
    END IF;

    IF p_phone IS NULL OR p_phone !~ '^[0-9]{8,15}$' THEN
        RAISE EXCEPTION 'Valid phone number is required.';
    END IF;

    IF p_lead_token_hash IS NULL
       OR p_lead_token_hash !~ '^[0-9a-f]{64}$' THEN
        RAISE EXCEPTION 'Invalid lead token hash.';
    END IF;

    RETURN QUERY
    INSERT INTO public.checkout_leads (
        customer_name,
        phone,
        email,
        package_id,
        package_title,
        destination,
        travel_date,
        travellers,
        selected_sharing,
        estimated_amount,
        source,
        special_request,
        lead_token_hash
    ) VALUES (
        trim(p_customer_name),
        p_phone,
        lower(trim(p_email)),
        p_package_id,
        p_package_title,
        p_destination,
        p_travel_date,
        p_travellers,
        p_selected_sharing,
        p_estimated_amount,
        p_source,
        p_special_request,
        p_lead_token_hash
    )
    RETURNING
        checkout_leads.id,
        checkout_leads.lead_number;
END;
$$;

-- Secure update_checkout_lead RPC (validates raw token via hash)
CREATE OR REPLACE FUNCTION public.update_checkout_lead(
    p_lead_id UUID,
    p_lead_token TEXT,
    p_current_step TEXT,
    p_selected_sharing TEXT,
    p_estimated_amount NUMERIC
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_hash TEXT := encode(digest(p_lead_token, 'sha256'), 'hex');
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.checkout_leads WHERE id = p_lead_id AND lead_token_hash = v_hash) THEN
        RAISE EXCEPTION 'Invalid lead token.';
    END IF;
    UPDATE public.checkout_leads
    SET current_step = p_current_step,
        selected_sharing = p_selected_sharing,
        estimated_amount = p_estimated_amount
    WHERE id = p_lead_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.create_checkout_lead(TEXT, TEXT, TEXT, BIGINT, TEXT, TEXT, DATE, INTEGER, TEXT, NUMERIC, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_checkout_lead(TEXT, TEXT, TEXT, BIGINT, TEXT, TEXT, DATE, INTEGER, TEXT, NUMERIC, TEXT, TEXT, TEXT) TO service_role;

REVOKE EXECUTE ON FUNCTION public.update_checkout_lead(UUID, TEXT, TEXT, TEXT, NUMERIC) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_checkout_lead(UUID, TEXT, TEXT, TEXT, NUMERIC) TO service_role;

-- Rate limit RPC permissions
REVOKE EXECUTE ON FUNCTION public.consume_guest_lead_rate_limit(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_guest_lead_rate_limit(TEXT, TEXT) TO service_role;

COMMIT;
