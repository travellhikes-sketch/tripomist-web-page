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
        NULL,
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

REVOKE EXECUTE ON FUNCTION public.prepare_payment_attempt(UUID, UUID, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prepare_payment_attempt(UUID, UUID, UUID) TO service_role;
