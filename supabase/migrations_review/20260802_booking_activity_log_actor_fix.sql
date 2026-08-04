-- Vercel/Voucher cancellation activity log actor column fix migration
-- File: supabase/migrations_review/20260802_booking_activity_log_actor_fix.sql

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
    v_verified_payment_sum NUMERIC(12,2) := 0;
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

    -- 4. Calculate verified paid amount
    -- Try successful/verified payment transactions first
    SELECT COALESCE(SUM(expected_amount_paise / 100.0), 0) INTO v_verified_payment_sum
    FROM public.payment_attempts
    WHERE booking_id = p_booking_id AND status = 'verified';

    IF v_verified_payment_sum > 0 THEN
        v_max_refundable := v_verified_payment_sum;
    ELSE
        -- Fallback to the recorded paid amount fields on the booking
        v_max_refundable := COALESCE(v_booking.cash_paid_amount, v_booking.advance_payment, 0);

        -- If legacy/paid status, fall back to calculated amount
        IF v_max_refundable = 0 AND v_booking.payment_status = 'paid' THEN
            v_max_refundable := COALESCE(v_booking.final_payable_amount, v_booking.final_amount, v_booking.total_amount, 0);
        END IF;
    END IF;

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
                    p_cancellation_reason,
                    p_coupon_expiry,
                    v_coupon_status,
                    v_admin_id
                ) RETURNING id INTO v_coupon_id;

                EXIT; -- Success
            EXCEPTION WHEN unique_violation THEN
                IF i = 10 THEN RAISE; END IF;
            END;
        END LOOP;

        -- Write voucher internal note
        IF p_coupon_notes IS NOT NULL AND length(trim(p_coupon_notes)) > 0 THEN
            INSERT INTO public.voucher_internal_notes (voucher_id, note, created_by)
            VALUES (v_coupon_id, trim(p_coupon_notes), v_admin_id);
        END IF;
    END IF;

    -- 6. Perform booking cancellation state updates
    UPDATE public.bookings
    SET booking_status = 'cancelled',
        payment_status = CASE WHEN p_refund_status = 'Fully Refunded' THEN 'refunded' ELSE payment_status END,
        voucher_id = COALESCE(v_coupon_id, voucher_id),
        cancellation_reason = trim(p_cancellation_reason),
        cancellation_notes = NULLIF(trim(p_cancellation_notes), ''),
        refund_status = p_refund_status,
        cancelled_at = NOW(),
        cancelled_by = v_admin_id
    WHERE id = p_booking_id;

    -- 7. Audit Log
    INSERT INTO public.booking_activity_logs (
        booking_id,
        action,
        field_name,
        old_value,
        new_value,
        changed_by,
        note
    ) VALUES (
        p_booking_id,
        'cancel',
        'booking_status',
        v_booking.booking_status || ' | ' || v_booking.payment_status,
        'cancelled' || ' | ' || CASE WHEN p_refund_status = 'Fully Refunded' THEN 'refunded' ELSE v_booking.payment_status END,
        v_admin_id,
        COALESCE(p_cancellation_reason, '') || ' (' || p_refund_status || CASE WHEN v_coupon_code IS NOT NULL THEN ', issued coupon ' || v_coupon_code ELSE '' END || ')'
    );

    v_result := jsonb_build_object(
        'booking_id', p_booking_id,
        'status', 'cancelled',
        'voucher_code', v_coupon_code,
        'voucher_amount', p_coupon_amount
    );

    RETURN v_result;
END;
$$;
