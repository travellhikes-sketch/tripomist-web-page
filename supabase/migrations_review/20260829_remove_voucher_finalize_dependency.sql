CREATE OR REPLACE FUNCTION public.finalize_verified_payment(
    p_payment_attempt_id UUID,
    p_razorpay_order_id TEXT,
    p_razorpay_payment_id TEXT,
    p_amount_paise BIGINT,
    p_currency TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_attempt RECORD;
    v_booking RECORD;
    v_cash_paid NUMERIC(12,2);
    v_temp_booking_id UUID;
BEGIN
    -- 1. Validate inputs
    IF p_payment_attempt_id IS NULL 
       OR p_razorpay_order_id IS NULL OR length(trim(p_razorpay_order_id)) = 0 
       OR p_razorpay_payment_id IS NULL OR length(trim(p_razorpay_payment_id)) = 0 
       OR p_amount_paise IS NULL OR p_amount_paise <= 0 
       OR p_currency IS NULL OR p_currency IS DISTINCT FROM 'INR' THEN
         RAISE EXCEPTION 'All verification parameters are required, amount > 0, and currency INR.';
    END IF;

    -- Get target booking_id from payment attempt first to obey lock ordering rules (Lock Booking before Attempt)
    SELECT booking_id INTO v_temp_booking_id FROM public.payment_attempts WHERE id = p_payment_attempt_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Payment attempt not found.';
    END IF;

    -- 2. LOCK BOOKING FIRST
    SELECT * INTO v_booking FROM public.bookings WHERE id = v_temp_booking_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Booking not found.';
    END IF;

    -- 3. LOCK PAYMENT ATTEMPT SECOND
    SELECT * INTO v_attempt FROM public.payment_attempts WHERE id = p_payment_attempt_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Payment attempt not found.';
    END IF;

    IF v_attempt.booking_id IS DISTINCT FROM v_booking.id THEN
        RAISE EXCEPTION 'Payment attempt booking_id mismatch.';
    END IF;

    -- Validate details BEFORE idempotent check to ensure data integrity
    IF v_attempt.razorpay_order_id IS DISTINCT FROM p_razorpay_order_id THEN
        RAISE EXCEPTION 'Razorpay order ID mismatch.';
    END IF;

    IF v_attempt.expected_amount_paise IS DISTINCT FROM p_amount_paise THEN
        RAISE EXCEPTION 'Payment amount mismatch (Expected %, Got %).', v_attempt.expected_amount_paise, p_amount_paise;
    END IF;

    IF v_attempt.currency IS DISTINCT FROM 'INR' THEN
        RAISE EXCEPTION 'Attempt currency must be INR.';
    END IF;

    -- Idempotency check: if already verified, return success
    IF v_attempt.status = 'verified' AND v_attempt.razorpay_payment_id = p_razorpay_payment_id THEN
        -- Require booking payment_status = paid and same razorpay_payment_id
        IF v_booking.payment_status IS DISTINCT FROM 'paid' OR v_booking.razorpay_payment_id IS DISTINCT FROM p_razorpay_payment_id THEN
            RAISE EXCEPTION 'Idempotency conflict: Payment attempt status is verified, but booking states are inconsistent. Reconciliation required.';
        END IF;

        RETURN jsonb_build_object(
            'success', true,
            'booking_id', v_attempt.booking_id,
            'payment_status', 'paid',
            'redemption_id', NULL,
            'message', 'Payment already verified and processed.'
        );
    ELSIF v_attempt.status = 'verified' THEN
        RAISE EXCEPTION 'Payment attempt already verified with a different payment ID.';
    END IF;

    -- Non-idempotent checks
    IF v_booking.payment_status IS DISTINCT FROM 'pending' THEN
        RAISE EXCEPTION 'Booking payment status must be pending.';
    END IF;

    IF v_attempt.status NOT IN ('order_created', 'verification_pending') THEN
        RAISE EXCEPTION 'Invalid payment attempt status: %', v_attempt.status;
    END IF;

    IF (v_booking.user_id IS NOT NULL AND v_booking.user_id IS DISTINCT FROM v_attempt.user_id) OR
       (v_booking.user_id IS NULL AND v_booking.checkout_lead_id IS DISTINCT FROM v_attempt.checkout_lead_id) THEN
        RAISE EXCEPTION 'User ownership mismatch between booking and attempt.';
    END IF;

    -- Reject if already marked paid using another payment ID
    IF v_booking.razorpay_payment_id IS NOT NULL AND v_booking.razorpay_payment_id IS DISTINCT FROM p_razorpay_payment_id THEN
        RAISE EXCEPTION 'Booking already paid with a different payment ID.';
    END IF;

    -- Recheck booking amount constraints
    IF (v_booking.final_payable_amount * 100)::BIGINT IS DISTINCT FROM v_attempt.expected_amount_paise THEN
        RAISE EXCEPTION 'Booking payable amount has changed since attempt was prepared.';
    END IF;

    -- 4. Mark booking paid/confirmed
    v_cash_paid := (p_amount_paise::NUMERIC / 100.00);
    UPDATE public.bookings SET
        payment_status = 'paid',
        booking_status = 'confirmed',
        razorpay_payment_id = p_razorpay_payment_id,
        cash_paid_amount = v_cash_paid
    WHERE id = v_attempt.booking_id;

    -- 5. Mark payment attempt verified
    UPDATE public.payment_attempts SET
        status = 'verified',
        razorpay_payment_id = p_razorpay_payment_id,
        verified_at = NOW(),
        updated_at = NOW()
    WHERE id = p_payment_attempt_id;

    -- Log activities
    INSERT INTO public.booking_activity_logs (
        booking_id, action, field_name, old_value, new_value, changed_by
    ) VALUES (
        v_attempt.booking_id, 'Payment Finalized', 'payment_status', 'pending', 'paid', v_attempt.user_id
    );

    RETURN jsonb_build_object(
        'success', true,
        'booking_id', v_attempt.booking_id,
        'payment_status', 'paid',
        'redemption_id', NULL
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.finalize_verified_payment(UUID, TEXT, TEXT, BIGINT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_verified_payment(UUID, TEXT, TEXT, BIGINT, TEXT) TO service_role;
