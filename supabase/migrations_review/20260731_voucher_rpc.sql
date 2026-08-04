BEGIN;

-- ============================================================================
-- TripoMist: Secure Voucher & Booking Database RPCs
-- File:    20260731_voucher_rpc.sql
-- Status:  REVIEW DRAFT — NOT YET APPROVED FOR EXECUTION
-- Author:  Schema Audit 2026-07-31
-- ============================================================================

-- ============================================================================
-- 1. admin_classify_booking
-- ============================================================================
CREATE OR REPLACE FUNCTION public.admin_classify_booking(
    p_booking_id UUID,
    p_sales_channel TEXT,
    p_b2b_partner_company TEXT DEFAULT NULL,
    p_b2b_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_admin_id UUID;
    v_booking RECORD;
BEGIN
    -- 1. Authentication & Authorization
    v_admin_id := auth.uid();
    IF v_admin_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Must be logged in.';
    END IF;

    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Forbidden: Admin access required.';
    END IF;

    -- 2. Input Validation
    IF p_sales_channel IS NULL THEN
        RAISE EXCEPTION 'Sales channel is required.';
    END IF;

    IF p_sales_channel NOT IN ('unclassified', 'b2b', 'b2c') THEN
        RAISE EXCEPTION 'Invalid sales channel: %', p_sales_channel;
    END IF;

    IF p_sales_channel = 'b2b' AND (p_b2b_partner_company IS NULL OR length(trim(p_b2b_partner_company)) = 0) THEN
        RAISE EXCEPTION 'B2B partner company name is required for B2B classification.';
    END IF;

    -- 3. Lock and retrieve booking
    SELECT * INTO v_booking FROM public.bookings WHERE id = p_booking_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Booking not found.';
    END IF;

    -- 4. Update booking
    UPDATE public.bookings
    SET
        sales_channel = p_sales_channel,
        b2b_partner_company = CASE WHEN p_sales_channel = 'b2b' THEN trim(p_b2b_partner_company) ELSE NULL END,
        b2b_notes = CASE WHEN p_sales_channel = 'b2b' THEN p_b2b_notes ELSE NULL END,
        classified_by = v_admin_id,
        classified_at = NOW()
    WHERE id = p_booking_id;

    -- 5. Log activity
    INSERT INTO public.booking_activity_logs (
        booking_id, action, field_name, old_value, new_value, changed_by
    ) VALUES (
        p_booking_id,
        'Classified Booking',
        'sales_channel',
        v_booking.sales_channel,
        p_sales_channel,
        v_admin_id
    );

    RETURN jsonb_build_object(
        'success', true,
        'booking_id', p_booking_id,
        'sales_channel', p_sales_channel
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_classify_booking(UUID, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_classify_booking(UUID, TEXT, TEXT, TEXT) TO authenticated;


-- ============================================================================
-- 2. admin_cancel_booking_with_coupon
-- ============================================================================
CREATE OR REPLACE FUNCTION public.admin_cancel_booking_with_coupon(
    p_booking_id UUID,
    p_cancellation_reason TEXT,
    p_cancellation_notes TEXT DEFAULT NULL,
    p_refund_status TEXT DEFAULT 'Refund Pending',
    p_issue_coupon BOOLEAN DEFAULT FALSE,
    p_coupon_amount NUMERIC DEFAULT NULL,
    p_coupon_expiry TIMESTAMPTZ DEFAULT NULL,
    p_coupon_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_admin_id UUID;
    v_booking RECORD;
    v_max_refundable NUMERIC(12,2) := 0;
    v_coupon_code TEXT;
    v_coupon_status TEXT;
    v_coupon_id UUID := NULL;
    v_constraint_name TEXT;
    v_result JSONB;
BEGIN
    -- 1. Authentication & Authorization
    v_admin_id := auth.uid();
    IF v_admin_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Must be logged in.';
    END IF;

    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Forbidden: Admin access required.';
    END IF;

    -- 2. Validate basic input parameters
    IF p_cancellation_reason IS NULL OR length(trim(p_cancellation_reason)) = 0 THEN
        RAISE EXCEPTION 'Cancellation reason is required.';
    END IF;

    IF p_refund_status IS NULL THEN
        RAISE EXCEPTION 'Refund status is required.';
    END IF;

    IF p_refund_status NOT IN ('Not Applicable', 'No Refund', 'Refund Pending', 'Partially Refunded', 'Fully Refunded') THEN
        RAISE EXCEPTION 'Invalid refund status: %', p_refund_status;
    END IF;

    IF p_issue_coupon AND p_refund_status NOT IN ('No Refund', 'Not Applicable') THEN
        RAISE EXCEPTION 'When issuing a cancellation coupon, refund status must be No Refund or Not Applicable.';
    END IF;

    -- 3. Lock and retrieve booking
    SELECT * INTO v_booking FROM public.bookings WHERE id = p_booking_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Booking not found.';
    END IF;

    IF v_booking.booking_status = 'cancelled' THEN
        RAISE EXCEPTION 'Booking is already cancelled.';
    END IF;

    -- 4. Calculate maximum allowable coupon amount
    v_max_refundable := COALESCE(v_booking.cash_paid_amount, v_booking.advance_payment, 0);

    -- 5. Process Coupon generation if requested
    IF p_issue_coupon THEN
        IF v_booking.payment_status IS DISTINCT FROM 'paid' THEN
            RAISE EXCEPTION 'Only paid bookings can be cancelled with a coupon.';
        END IF;

        IF p_coupon_amount IS NULL OR p_coupon_amount <= 0 THEN
            RAISE EXCEPTION 'Coupon amount must be a positive number.';
        END IF;

        IF p_coupon_amount > v_max_refundable THEN
            RAISE EXCEPTION 'Coupon amount (%) exceeds maximum refundable paid amount (%).', p_coupon_amount, v_max_refundable;
        END IF;

        IF p_coupon_expiry IS NULL OR p_coupon_expiry <= NOW() THEN
            RAISE EXCEPTION 'Coupon expiry date must be in the future.';
        END IF;

        -- Generate secure code with collision retry
        FOR i IN 1..10 LOOP
            v_coupon_code := 'TRIPO-' || UPPER(SUBSTR(REPLACE(gen_random_uuid()::text, '-', ''), 1, 12));
            v_coupon_status := CASE WHEN v_booking.user_id IS NULL THEN 'pending_link' ELSE 'active' END;

            BEGIN
                INSERT INTO public.vouchers (
                    code,
                    user_id,
                    source_booking_id,
                    source_type,
                    original_amount,
                    remaining_amount,
                    issued_reason,
                    expires_at,
                    status,
                    created_by
                ) VALUES (
                    v_coupon_code,
                    v_booking.user_id,
                    v_booking.id,
                    'cancellation',
                    p_coupon_amount,
                    p_coupon_amount,
                    trim(p_cancellation_reason),
                    p_coupon_expiry,
                    v_coupon_status,
                    v_admin_id
                ) RETURNING id INTO v_coupon_id;
                EXIT;
            EXCEPTION 
                WHEN unique_violation THEN
                    GET STACKED DIAGNOSTICS v_constraint_name = CONSTRAINT_NAME;
                    IF v_constraint_name = 'idx_vouchers_code_upper' THEN
                        IF i = 10 THEN
                            RAISE EXCEPTION 'Failed to generate unique coupon code after multiple attempts.';
                        END IF;
                    ELSE
                        RAISE;
                    END IF;
            END;
        END LOOP;

        -- Insert internal notes if provided
        IF p_coupon_notes IS NOT NULL AND length(trim(p_coupon_notes)) > 0 THEN
            INSERT INTO public.voucher_internal_notes (
                voucher_id, internal_notes, created_by
            ) VALUES (
                v_coupon_id, trim(p_coupon_notes), v_admin_id
            );
        END IF;

        -- Log coupon activity
        INSERT INTO public.booking_activity_logs (
            booking_id, action, field_name, new_value, changed_by
        ) VALUES (
            p_booking_id, 'Cancellation Voucher Issued', 'voucher_code', v_coupon_code, v_admin_id
        );
    END IF;

    -- 6. Cancel the Booking
    UPDATE public.bookings SET
        booking_status = 'cancelled',
        cancellation_reason = trim(p_cancellation_reason),
        cancellation_notes = trim(p_cancellation_notes),
        refund_status = p_refund_status,
        cancelled_at = NOW(),
        cancelled_by = v_admin_id
    WHERE id = p_booking_id;

    -- Log booking status change
    INSERT INTO public.booking_activity_logs (
        booking_id, action, field_name, old_value, new_value, changed_by
    ) VALUES (
        p_booking_id, 'Booking Cancelled', 'booking_status', v_booking.booking_status, 'cancelled', v_admin_id
    );

    v_result := jsonb_build_object(
        'success', true,
        'booking_id', p_booking_id,
        'voucher_id', v_coupon_id,
        'voucher_code', v_coupon_code,
        'max_refundable_amount', v_max_refundable
    );

    RETURN v_result;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_cancel_booking_with_coupon(UUID, TEXT, TEXT, TEXT, BOOLEAN, NUMERIC, TIMESTAMPTZ, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_cancel_booking_with_coupon(UUID, TEXT, TEXT, TEXT, BOOLEAN, NUMERIC, TIMESTAMPTZ, TEXT) TO authenticated;


-- ============================================================================
-- 3. admin_create_service_recovery_with_coupon
-- ============================================================================
CREATE OR REPLACE FUNCTION public.admin_create_service_recovery_with_coupon(
    p_booking_id UUID,
    p_issue_title TEXT,
    p_issue_description TEXT,
    p_priority TEXT,
    p_incident_date DATE,
    p_internal_notes TEXT DEFAULT NULL,
    p_issue_coupon BOOLEAN DEFAULT FALSE,
    p_coupon_amount NUMERIC DEFAULT NULL,
    p_coupon_expiry TIMESTAMPTZ DEFAULT NULL,
    p_coupon_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_admin_id UUID;
    v_booking RECORD;
    v_case_id UUID;
    v_coupon_code TEXT;
    v_coupon_status TEXT;
    v_coupon_id UUID := NULL;
    v_existing_active_count INTEGER := 0;
    v_max_coupon NUMERIC(12,2) := 0;
    v_constraint_name TEXT;
    v_result JSONB;
BEGIN
    -- 1. Authentication & Authorization
    v_admin_id := auth.uid();
    IF v_admin_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Must be logged in.';
    END IF;

    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Forbidden: Admin access required.';
    END IF;

    -- 2. Input Validations
    IF p_issue_title IS NULL OR length(trim(p_issue_title)) = 0 THEN
        RAISE EXCEPTION 'Issue title is required.';
    END IF;

    IF p_issue_description IS NULL OR length(trim(p_issue_description)) = 0 THEN
        RAISE EXCEPTION 'Issue description is required.';
    END IF;

    IF p_priority IS NULL THEN
        RAISE EXCEPTION 'Priority is required.';
    END IF;

    IF p_priority NOT IN ('low', 'medium', 'high', 'critical') THEN
        RAISE EXCEPTION 'Invalid priority level: %', p_priority;
    END IF;

    IF p_incident_date IS NULL THEN
        RAISE EXCEPTION 'Incident date is required.';
    END IF;

    IF p_incident_date > CURRENT_DATE THEN
        RAISE EXCEPTION 'Incident date cannot be in the future.';
    END IF;

    -- 3. Lock and retrieve booking
    SELECT * INTO v_booking FROM public.bookings WHERE id = p_booking_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Booking not found.';
    END IF;

    -- 4. Calculate maximum service recovery coupon limit
    v_max_coupon := COALESCE(v_booking.final_amount, v_booking.total_amount, 0);

    -- 5. Prevent duplicate active service recovery coupons for this booking
    IF p_issue_coupon THEN
        SELECT COUNT(*) INTO v_existing_active_count
        FROM public.vouchers
        WHERE source_booking_id = p_booking_id
          AND source_type = 'service_recovery'
          AND status NOT IN ('cancelled', 'expired');

        IF v_existing_active_count > 0 THEN
            RAISE EXCEPTION 'An active service recovery coupon has already been issued for this booking.';
        END IF;

        IF p_coupon_amount IS NULL OR p_coupon_amount <= 0 THEN
            RAISE EXCEPTION 'Coupon amount must be a positive number.';
        END IF;

        IF p_coupon_amount > v_max_coupon THEN
            RAISE EXCEPTION 'Service recovery coupon amount (%) cannot exceed booking value (%).', p_coupon_amount, v_max_coupon;
        END IF;

        IF p_coupon_expiry IS NULL OR p_coupon_expiry <= NOW() THEN
            RAISE EXCEPTION 'Coupon expiry date must be in the future.';
        END IF;
    END IF;

    -- 6. Create Service Recovery Case
    INSERT INTO public.service_recovery_cases (
        user_id,
        booking_id,
        issue_title,
        issue_description,
        priority,
        incident_date,
        internal_notes,
        created_by
    ) VALUES (
        v_booking.user_id,
        p_booking_id,
        trim(p_issue_title),
        trim(p_issue_description),
        p_priority,
        p_incident_date,
        trim(p_internal_notes),
        v_admin_id
    ) RETURNING id INTO v_case_id;

    -- 7. Issue Voucher if requested
    IF p_issue_coupon THEN
        -- Generate secure code with collision retry
        FOR i IN 1..10 LOOP
            v_coupon_code := 'TRIPO-' || UPPER(SUBSTR(REPLACE(gen_random_uuid()::text, '-', ''), 1, 12));
            v_coupon_status := CASE WHEN v_booking.user_id IS NULL THEN 'pending_link' ELSE 'active' END;

            BEGIN
                INSERT INTO public.vouchers (
                    code,
                    user_id,
                    source_booking_id,
                    service_recovery_case_id,
                    source_type,
                    original_amount,
                    remaining_amount,
                    issued_reason,
                    expires_at,
                    status,
                    created_by
                ) VALUES (
                    v_coupon_code,
                    v_booking.user_id,
                    v_booking.id,
                    v_case_id,
                    'service_recovery',
                    p_coupon_amount,
                    p_coupon_amount,
                    trim(p_issue_title),
                    p_coupon_expiry,
                    v_coupon_status,
                    v_admin_id
                ) RETURNING id INTO v_coupon_id;
                EXIT;
            EXCEPTION 
                WHEN unique_violation THEN
                    GET STACKED DIAGNOSTICS v_constraint_name = CONSTRAINT_NAME;
                    IF v_constraint_name = 'idx_vouchers_code_upper' THEN
                        IF i = 10 THEN
                            RAISE EXCEPTION 'Failed to generate unique coupon code after multiple attempts.';
                        END IF;
                    ELSE
                        RAISE;
                    END IF;
            END;
        END LOOP;

        -- Insert internal notes if provided
        IF p_coupon_notes IS NOT NULL AND length(trim(p_coupon_notes)) > 0 THEN
            INSERT INTO public.voucher_internal_notes (
                voucher_id, internal_notes, created_by
            ) VALUES (
                v_coupon_id, trim(p_coupon_notes), v_admin_id
            );
        END IF;

        -- Log coupon activity
        INSERT INTO public.booking_activity_logs (
            booking_id, action, field_name, new_value, changed_by
        ) VALUES (
            p_booking_id, 'Service Recovery Voucher Issued', 'voucher_code', v_coupon_code, v_admin_id
        );
    END IF;

    -- Log service recovery case creation
    INSERT INTO public.booking_activity_logs (
        booking_id, action, field_name, new_value, changed_by
    ) VALUES (
        p_booking_id, 'Service Recovery Case Created', 'service_recovery_id', v_case_id::text, v_admin_id
    );

    v_result := jsonb_build_object(
        'success', true,
        'case_id', v_case_id,
        'voucher_id', v_coupon_id,
        'voucher_code', v_coupon_code
    );

    RETURN v_result;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_create_service_recovery_with_coupon(UUID, TEXT, TEXT, TEXT, DATE, TEXT, BOOLEAN, NUMERIC, TIMESTAMPTZ, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_create_service_recovery_with_coupon(UUID, TEXT, TEXT, TEXT, DATE, TEXT, BOOLEAN, NUMERIC, TIMESTAMPTZ, TEXT) TO authenticated;


-- ============================================================================
-- 4. claim_pending_coupons_for_current_user
-- ============================================================================
CREATE OR REPLACE FUNCTION public.claim_pending_coupons_for_current_user()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id UUID;
    v_auth_record RECORD;
    v_email TEXT := NULL;
    v_phone TEXT := NULL;
    v_phone_cleaned TEXT := NULL;
    v_linked_count INTEGER := 0;
    v_linked_codes TEXT[] := '{}';
    v_voucher RECORD;
BEGIN
    -- 1. Authentication Check
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Must be logged in.';
    END IF;

    -- 2. Read email and phone from auth.users (do not trust auth.jwt() claims)
    -- Only use them if they have been confirmed.
    SELECT email, phone, email_confirmed_at, phone_confirmed_at 
    INTO v_auth_record 
    FROM auth.users 
    WHERE id = v_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'User auth record not found.';
    END IF;

    IF v_auth_record.email_confirmed_at IS NOT NULL THEN
        v_email := LOWER(TRIM(v_auth_record.email));
    END IF;

    IF v_auth_record.phone_confirmed_at IS NOT NULL AND v_auth_record.phone IS NOT NULL THEN
        v_phone := TRIM(v_auth_record.phone);
        -- Normalize phone to digits only
        v_phone := regexp_replace(v_phone, '[^0-9]', '', 'g');
        
        -- Clean country code prefixes if phone length is greater than 10 digits
        IF length(v_phone) > 10 THEN
            v_phone_cleaned := regexp_replace(v_phone, '^91', '');
        ELSE
            v_phone_cleaned := v_phone;
        END IF;
    END IF;

    -- Safety check: if user has no confirmed contact details, exit early
    IF (v_email IS NULL OR v_email = '') AND (v_phone IS NULL OR v_phone = '') THEN
        RETURN jsonb_build_object(
            'success', true,
            'linked_count', 0,
            'linked_codes', v_linked_codes,
            'message', 'No confirmed email or phone found.'
        );
    END IF;

    -- 3. Query, lock, and link matching pending_link vouchers
    -- Excludes expired or not-yet-valid coupons.
    -- Ensures booking user_id is NULL or equal to auth.uid()
    FOR v_voucher IN
        SELECT v.id, v.code, v.source_booking_id
        FROM public.vouchers v
        JOIN public.bookings b ON v.source_booking_id = b.id
        WHERE v.status = 'pending_link'
          AND v.user_id IS NULL
          AND v.valid_from <= NOW()
          AND v.expires_at > NOW()
          AND (b.user_id IS NULL OR b.user_id = v_user_id)
          AND (
              -- Match BOTH if both are available
              (v_email IS NOT NULL AND v_email <> '' AND v_phone IS NOT NULL AND v_phone <> '' AND LOWER(BTRIM(b.email)) = v_email AND (
                  regexp_replace(b.phone, '[^0-9]', '', 'g') = v_phone 
                  OR regexp_replace(b.phone, '[^0-9]', '', 'g') = v_phone_cleaned
              ))
              OR
              -- Match Email only if Phone is unavailable
              ((v_phone IS NULL OR v_phone = '') AND v_email IS NOT NULL AND v_email <> '' AND LOWER(BTRIM(b.email)) = v_email)
              OR
              -- Match Phone only if Email is unavailable
              ((v_email IS NULL OR v_email = '') AND v_phone IS NOT NULL AND v_phone <> '' AND (
                  regexp_replace(b.phone, '[^0-9]', '', 'g') = v_phone 
                  OR regexp_replace(b.phone, '[^0-9]', '', 'g') = v_phone_cleaned
              ))
          )
        FOR UPDATE OF v
    LOOP
        -- Link voucher to auth.uid()
        UPDATE public.vouchers
        SET
            user_id = v_user_id,
            status = 'active',
            updated_at = NOW()
        WHERE id = v_voucher.id;

        -- Update source booking user_id if currently NULL
        UPDATE public.bookings
        SET 
            user_id = v_user_id
        WHERE id = v_voucher.source_booking_id
          AND user_id IS NULL;

        -- Log coupon linkage activity
        INSERT INTO public.booking_activity_logs (
            booking_id, action, field_name, new_value, changed_by
        ) VALUES (
            v_voucher.source_booking_id, 'Coupon Linked to Customer', 'user_id', v_user_id::text, v_user_id
        );

        v_linked_count := v_linked_count + 1;
        v_linked_codes := array_append(v_linked_codes, v_voucher.code);
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'linked_count', v_linked_count,
        'linked_codes', v_linked_codes
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.claim_pending_coupons_for_current_user() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_pending_coupons_for_current_user() TO authenticated;

COMMIT;
