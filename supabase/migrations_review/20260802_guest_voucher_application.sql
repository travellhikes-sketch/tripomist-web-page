BEGIN;

-- ============================================================================
-- 1. Create Coupon Attempt Limits Table & Security DEFINER RPCs
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.coupon_attempt_limits (
    actor_hash TEXT PRIMARY KEY,
    attempts INTEGER NOT NULL DEFAULT 1,
    blocked_until TIMESTAMPTZ,
    last_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.coupon_attempt_limits ENABLE ROW LEVEL SECURITY;

-- Revoke all permissions from PUBLIC, anon, authenticated
REVOKE ALL ON public.coupon_attempt_limits FROM PUBLIC, anon, authenticated;

-- Add helper to normalize phone digits in SQL (matching TS regex logic)
CREATE OR REPLACE FUNCTION public.normalize_phone_digits(p_phone TEXT)
RETURNS TEXT
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
    v_digits TEXT;
BEGIN
    v_digits := regexp_replace(COALESCE(p_phone, ''), '\D', '', 'g');
    IF length(v_digits) = 12 AND starts_with(v_digits, '91') THEN
        RETURN substring(v_digits from 3);
    ELSE
        RETURN v_digits;
    END IF;
END;
$$;

-- Create service_role-only RPCs for rate-limiting
CREATE OR REPLACE FUNCTION public.is_coupon_attempt_blocked(p_actor_hash TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_blocked BOOLEAN := FALSE;
BEGIN
    SELECT (blocked_until IS NOT NULL AND blocked_until > NOW()) INTO v_blocked
    FROM public.coupon_attempt_limits
    WHERE actor_hash = p_actor_hash;
    
    RETURN COALESCE(v_blocked, FALSE);
END;
$$;

CREATE OR REPLACE FUNCTION public.record_failed_coupon_attempt(p_actor_hash TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    INSERT INTO public.coupon_attempt_limits (actor_hash, attempts, last_attempt_at, blocked_until)
    VALUES (p_actor_hash, 1, NOW(), NULL)
    ON CONFLICT (actor_hash) DO UPDATE
    SET attempts = CASE 
            WHEN coupon_attempt_limits.blocked_until IS NOT NULL AND coupon_attempt_limits.blocked_until <= NOW() THEN 1
            ELSE coupon_attempt_limits.attempts + 1
          END,
        last_attempt_at = NOW(),
        blocked_until = CASE 
            WHEN (CASE 
                    WHEN coupon_attempt_limits.blocked_until IS NOT NULL AND coupon_attempt_limits.blocked_until <= NOW() THEN 1
                    ELSE coupon_attempt_limits.attempts + 1
                  END) >= 5 THEN NOW() + INTERVAL '10 minutes'
            ELSE NULL
          END;
END;
$$;

CREATE OR REPLACE FUNCTION public.clear_coupon_attempts(p_actor_hash TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    DELETE FROM public.coupon_attempt_limits WHERE actor_hash = p_actor_hash;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.is_coupon_attempt_blocked(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_coupon_attempt_blocked(TEXT) TO service_role;

REVOKE EXECUTE ON FUNCTION public.record_failed_coupon_attempt(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_failed_coupon_attempt(TEXT) TO service_role;

REVOKE EXECUTE ON FUNCTION public.clear_coupon_attempts(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.clear_coupon_attempts(TEXT) TO service_role;


-- ============================================================================
-- 2. Audit and Update public.voucher_reservations for Guests
-- ============================================================================

-- Make user_id nullable
ALTER TABLE public.voucher_reservations ALTER COLUMN user_id DROP NOT NULL;

-- Add checkout_lead_id column referencing checkout_leads(id)
ALTER TABLE public.voucher_reservations ADD COLUMN IF NOT EXISTS checkout_lead_id UUID REFERENCES public.checkout_leads(id) ON DELETE SET NULL;

-- Add constraint requiring exactly one owner (either user_id or checkout_lead_id)
ALTER TABLE public.voucher_reservations DROP CONSTRAINT IF EXISTS check_voucher_reservations_owner;
ALTER TABLE public.voucher_reservations ADD CONSTRAINT check_voucher_reservations_owner
  CHECK (
    (user_id IS NOT NULL AND checkout_lead_id IS NULL) OR
    (user_id IS NULL AND checkout_lead_id IS NOT NULL)
  );

-- Create index for checkout_lead_id
CREATE INDEX IF NOT EXISTS idx_voucher_reservations_checkout_lead_id ON public.voucher_reservations(checkout_lead_id);


-- ============================================================================
-- 3. Update public.reserve_coupon_for_checkout
-- ============================================================================

CREATE OR REPLACE FUNCTION public.reserve_coupon_for_checkout(
    p_booking_id UUID,
    p_coupon_code TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_booking RECORD;
    v_voucher RECORD;
    v_active_reserved NUMERIC(12,2) := 0;
    v_available_balance NUMERIC(12,2) := 0;
    v_requested_discount NUMERIC(12,2) := 0;
    v_final_payable NUMERIC(12,2) := 0;
    v_reservation_id UUID := NULL;
    v_existing_reservation RECORD;
    v_reservation_expiry TIMESTAMPTZ;
    
    v_current_phone TEXT;
    v_current_email TEXT;
    v_source_booking_lead_id UUID;
    v_source_phone TEXT;
    v_source_email TEXT;
BEGIN
    -- 1. Validate inputs
    IF p_booking_id IS NULL OR p_coupon_code IS NULL OR length(trim(p_coupon_code)) = 0 THEN
        RAISE EXCEPTION 'Booking ID and Coupon code are required.';
    END IF;

    -- 2. Lock booking
    SELECT * INTO v_booking FROM public.bookings WHERE id = p_booking_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Booking not found.';
    END IF;

    IF v_booking.user_id IS NULL AND v_booking.checkout_lead_id IS NULL THEN
        RAISE EXCEPTION 'Booking ownership (user_id or checkout_lead_id) is required.';
    END IF;

    IF v_booking.booking_status IS DISTINCT FROM 'new' AND v_booking.booking_status IS DISTINCT FROM 'contacted' THEN
        RAISE EXCEPTION 'Booking status must be new or contacted.';
    END IF;

    IF v_booking.payment_status IS DISTINCT FROM 'pending' THEN
        RAISE EXCEPTION 'Booking payment_status must be pending.';
    END IF;

    -- Reject coupon if ANY payment attempt already exists for that booking
    IF EXISTS (
        SELECT 1 FROM public.payment_attempts WHERE booking_id = p_booking_id
    ) THEN
        RAISE EXCEPTION 'Coupon cannot be reserved: payment attempt already exists for this booking.';
    END IF;

    IF v_booking.amount_before_voucher IS NULL OR v_booking.amount_before_voucher <= 0 THEN
        RAISE EXCEPTION 'Booking amount_before_voucher must be populated and greater than zero.';
    END IF;

    -- 3. Lock voucher
    SELECT * INTO v_voucher FROM public.vouchers WHERE UPPER(code) = UPPER(trim(p_coupon_code)) FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid coupon code.';
    END IF;

    -- Prevent using coupon on its own source booking
    IF v_voucher.source_booking_id = p_booking_id THEN
        RAISE EXCEPTION 'Invalid coupon code.';
    END IF;

    -- Verify voucher validity window
    IF v_voucher.valid_from > NOW() OR v_voucher.expires_at <= NOW() THEN
        RAISE EXCEPTION 'Invalid coupon code.';
    END IF;

    -- Ownership verification:
    IF v_booking.user_id IS NOT NULL THEN
        -- Logged-in: voucher.user_id must equal booking.user_id and status must be active/partially_used
        IF v_voucher.user_id IS NULL OR v_booking.user_id IS DISTINCT FROM v_voucher.user_id THEN
            RAISE EXCEPTION 'Invalid coupon code.';
        END IF;
        IF v_voucher.status NOT IN ('active', 'partially_used') THEN
            RAISE EXCEPTION 'Invalid coupon code.';
        END IF;
    ELSE
        -- Guest: voucher.user_id must be NULL, status must be pending_link
        IF v_voucher.user_id IS NOT NULL THEN
            RAISE EXCEPTION 'Invalid coupon code.';
        END IF;
        IF v_voucher.status IS DISTINCT FROM 'pending_link' THEN
            RAISE EXCEPTION 'Invalid coupon code.';
        END IF;

        -- Get current checkout lead details
        SELECT phone, email INTO v_current_phone, v_current_email 
        FROM public.checkout_leads WHERE id = v_booking.checkout_lead_id;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Invalid coupon code.';
        END IF;

        -- Get source booking's checkout lead details
        SELECT checkout_lead_id INTO v_source_booking_lead_id 
        FROM public.bookings WHERE id = v_voucher.source_booking_id;
        IF NOT FOUND OR v_source_booking_lead_id IS NULL THEN
            RAISE EXCEPTION 'Invalid coupon code.';
        END IF;

        SELECT phone, email INTO v_source_phone, v_source_email 
        FROM public.checkout_leads WHERE id = v_source_booking_lead_id;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Invalid coupon code.';
        END IF;

        -- Match normalized phone and lowercase email
        IF public.normalize_phone_digits(v_current_phone) IS DISTINCT FROM public.normalize_phone_digits(v_source_phone) OR
           LOWER(TRIM(v_current_email)) IS DISTINCT FROM LOWER(TRIM(v_source_email)) THEN
            RAISE EXCEPTION 'Invalid coupon code.';
        END IF;
    END IF;

    -- 4. Check for existing active reservation for this booking
    SELECT * INTO v_existing_reservation 
    FROM public.voucher_reservations 
    WHERE booking_id = p_booking_id 
      AND status IN ('pending', 'payment_pending')
    LIMIT 1;

    IF FOUND THEN
        -- Verify it is unexpired
        IF v_existing_reservation.expires_at <= NOW() THEN
            RAISE EXCEPTION 'Active reservation has expired by time; reconciliation required.';
        ELSIF v_existing_reservation.status = 'payment_pending' THEN
            RAISE EXCEPTION 'Active reservation is in payment_pending status; reconciliation required.';
        ELSIF v_existing_reservation.voucher_id = v_voucher.id THEN
            -- Idempotency check: if it is already reserved on the same voucher, return success
            RETURN jsonb_build_object(
                'success', true,
                'reservation_id', v_existing_reservation.id,
                'reserved_amount', v_existing_reservation.reserved_amount,
                'final_payable_amount', v_booking.final_payable_amount,
                'message', 'Voucher is already reserved for this checkout.'
            );
        ELSE
            RAISE EXCEPTION 'Another voucher reservation is already active on this booking.';
        END IF;
    END IF;

    -- 5. Calculate available voucher balance (including active reservations elsewhere)
    SELECT COALESCE(SUM(reserved_amount), 0) INTO v_active_reserved
    FROM public.voucher_reservations
    WHERE voucher_id = v_voucher.id
      AND status IN ('pending', 'payment_pending')
      AND expires_at > NOW();

    v_available_balance := v_voucher.remaining_amount - v_active_reserved;
    IF v_available_balance <= 0 THEN
        RAISE EXCEPTION 'Invalid coupon code.';
    END IF;

    -- 6. Calculate secure discount using database-calculated amount
    v_requested_discount := LEAST(v_booking.amount_before_voucher, v_available_balance);
    IF v_requested_discount <= 0 THEN
        RAISE EXCEPTION 'Invalid coupon code.';
    END IF;

    v_final_payable := v_booking.amount_before_voucher - v_requested_discount;

    -- 7. Insert 15-minute reservation
    v_reservation_expiry := NOW() + INTERVAL '15 minutes';
    INSERT INTO public.voucher_reservations (
        voucher_id,
        booking_id,
        user_id,
        checkout_lead_id,
        reserved_amount,
        status,
        expires_at
    ) VALUES (
        v_voucher.id,
        p_booking_id,
        v_booking.user_id,
        v_booking.checkout_lead_id,
        v_requested_discount,
        'pending',
        v_reservation_expiry
    ) RETURNING id INTO v_reservation_id;

    -- 8. Update Booking financial fields
    UPDATE public.bookings SET
        voucher_id = v_voucher.id,
        voucher_discount = v_requested_discount,
        final_payable_amount = v_final_payable
    WHERE id = p_booking_id;

    -- 9. Log activity (never put checkout_lead_id in changed_by; use NULL for guests)
    INSERT INTO public.booking_activity_logs (
        booking_id, action, field_name, old_value, new_value, changed_by
    ) VALUES (
        p_booking_id,
        'Voucher Reserved',
        'voucher_discount',
        '0',
        v_requested_discount::text,
        v_booking.user_id
    );

    RETURN jsonb_build_object(
        'success', true,
        'reservation_id', v_reservation_id,
        'reserved_amount', v_requested_discount,
        'final_payable_amount', v_final_payable,
        'expires_at', v_reservation_expiry
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.reserve_coupon_for_checkout(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_coupon_for_checkout(UUID, TEXT) TO service_role;


-- ============================================================================
-- 4. Update public.prepare_payment_attempt
-- ============================================================================

CREATE OR REPLACE FUNCTION public.prepare_payment_attempt(
    p_booking_id UUID,
    p_idempotency_key UUID
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

    IF v_booking.user_id IS NULL AND v_booking.checkout_lead_id IS NULL THEN
        RAISE EXCEPTION 'Booking ownership is required.';
    END IF;

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
        IF (v_booking.user_id IS NOT NULL AND v_reservation.user_id IS DISTINCT FROM v_booking.user_id) OR
           (v_booking.user_id IS NULL AND v_reservation.checkout_lead_id IS DISTINCT FROM v_booking.checkout_lead_id) THEN
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

    -- 6. Generate deterministic receipt from idempotency key using full 32 hex chars (total 36 chars)
    v_receipt := 'REC-' || UPPER(REPLACE(p_idempotency_key::text, '-', ''));

    -- 7. Insert payment attempt in 'preparing' status with expires_at (10 minutes matching SLA)
    INSERT INTO public.payment_attempts (
        user_id,
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
        'status', v_attempt.status
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.prepare_payment_attempt(UUID, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prepare_payment_attempt(UUID, UUID) TO service_role;


-- ============================================================================
-- 5. Update public.mark_payment_order_created
-- ============================================================================

CREATE OR REPLACE FUNCTION public.mark_payment_order_created(
    p_payment_attempt_id UUID,
    p_claim_token UUID,
    p_razorpay_order_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_attempt RECORD;
    v_reservation RECORD;
BEGIN
    -- 1. Validate inputs
    IF p_payment_attempt_id IS NULL OR p_claim_token IS NULL OR p_razorpay_order_id IS NULL OR length(trim(p_razorpay_order_id)) = 0 THEN
        RAISE EXCEPTION 'Attempt ID, Claim token, and Order ID are required.';
    END IF;

    -- 2. Lock and verify attempt claim
    SELECT * INTO v_attempt FROM public.payment_attempts WHERE id = p_payment_attempt_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Payment attempt not found.';
    END IF;

    -- Idempotency check: if order ID is already saved, succeed idempotently
    IF v_attempt.status = 'order_created' AND v_attempt.razorpay_order_id = p_razorpay_order_id THEN
        RETURN jsonb_build_object(
            'success', true,
            'payment_attempt_id', p_payment_attempt_id,
            'status', 'order_created',
            'message', 'Order already marked created.'
        );
    ELSIF v_attempt.status = 'order_created' OR v_attempt.razorpay_order_id IS NOT NULL THEN
        RAISE EXCEPTION 'A different Razorpay order ID is already registered.';
    END IF;

    IF v_attempt.claim_token IS DISTINCT FROM p_claim_token OR v_attempt.claim_expires_at <= NOW() THEN
        RAISE EXCEPTION 'Invalid or expired claim token.';
    END IF;

    IF v_attempt.status IS DISTINCT FROM 'preparing' THEN
        RAISE EXCEPTION 'Invalid status transition from: %', v_attempt.status;
    END IF;

    -- Lock linked reservation
    IF v_attempt.reservation_id IS NOT NULL THEN
        SELECT * INTO v_reservation FROM public.voucher_reservations WHERE id = v_attempt.reservation_id FOR UPDATE;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Linked reservation not found.';
        END IF;

        IF v_reservation.status IS DISTINCT FROM 'pending' THEN
            RAISE EXCEPTION 'Reservation is not active or pending.';
        END IF;

        IF v_reservation.expires_at <= NOW() THEN
            RAISE EXCEPTION 'Reservation has expired.';
        END IF;

        -- Verify reservation booking_id and owner match the payment attempt
        IF v_reservation.booking_id IS DISTINCT FROM v_attempt.booking_id OR 
           (v_attempt.user_id IS NOT NULL AND v_reservation.user_id IS DISTINCT FROM v_attempt.user_id) OR
           (v_attempt.user_id IS NULL AND v_reservation.checkout_lead_id IS DISTINCT FROM v_attempt.checkout_lead_id) THEN
            RAISE EXCEPTION 'Reservation ownership and booking must match the payment attempt.';
        END IF;
    END IF;

    -- 3. Save order_id and update status to order_created
    UPDATE public.payment_attempts SET
        razorpay_order_id = p_razorpay_order_id,
        status = 'order_created',
        order_created_at = NOW(),
        updated_at = NOW()
    WHERE id = p_payment_attempt_id;

    -- 4. Advance reservation status to payment_pending if linked
    IF v_attempt.reservation_id IS NOT NULL THEN
        UPDATE public.voucher_reservations SET
            status = 'payment_pending',
            updated_at = NOW()
        WHERE id = v_attempt.reservation_id;
    END IF;

    -- Log activity
    INSERT INTO public.booking_activity_logs (
        booking_id, action, field_name, new_value, changed_by
    ) VALUES (
        v_attempt.booking_id, 'Razorpay Order Created', 'razorpay_order_id', p_razorpay_order_id, v_attempt.user_id
    );

    RETURN jsonb_build_object(
        'success', true,
        'payment_attempt_id', p_payment_attempt_id,
        'status', 'order_created'
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.mark_payment_order_created(UUID, UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_payment_order_created(UUID, UUID, TEXT) TO service_role;


-- ============================================================================
-- 6. Update public.finalize_verified_payment
-- ============================================================================

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
    v_voucher RECORD;
    v_reservation RECORD;
    v_redemption_id UUID;
    v_cash_paid NUMERIC(12,2);
    v_temp_booking_id UUID;
    v_balance_before NUMERIC(12,2);
    v_balance_after NUMERIC(12,2);
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

        -- Fetch existing redemption_id if present
        SELECT id INTO v_redemption_id 
        FROM public.voucher_redemptions 
        WHERE payment_attempt_id = p_payment_attempt_id;

        RETURN jsonb_build_object(
            'success', true,
            'booking_id', v_attempt.booking_id,
            'payment_status', 'paid',
            'redemption_id', v_redemption_id,
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

    -- 4. Process voucher deduction if a reservation is attached
    IF v_attempt.reservation_id IS NOT NULL THEN
        -- Lock reservation
        SELECT * INTO v_reservation 
        FROM public.voucher_reservations 
        WHERE id = v_attempt.reservation_id FOR UPDATE;
        
        IF NOT FOUND OR v_reservation.status NOT IN ('pending', 'payment_pending') THEN
            RAISE EXCEPTION 'Voucher reservation is not active.';
        END IF;

        -- Verify matching IDs and ownership
        IF v_reservation.booking_id IS DISTINCT FROM v_booking.id THEN
            RAISE EXCEPTION 'Reservation booking ID mismatch.';
        END IF;
        IF (v_booking.user_id IS NOT NULL AND (v_reservation.user_id IS DISTINCT FROM v_booking.user_id OR v_reservation.user_id IS DISTINCT FROM v_attempt.user_id)) OR
           (v_booking.user_id IS NULL AND (v_reservation.checkout_lead_id IS DISTINCT FROM v_booking.checkout_lead_id OR v_reservation.checkout_lead_id IS DISTINCT FROM v_attempt.checkout_lead_id)) THEN
            RAISE EXCEPTION 'Reservation owner mismatch.';
        END IF;
        IF v_reservation.voucher_id IS DISTINCT FROM v_booking.voucher_id THEN
            RAISE EXCEPTION 'Reservation voucher ID mismatch.';
        END IF;
        IF v_reservation.reserved_amount IS DISTINCT FROM v_booking.voucher_discount THEN
            RAISE EXCEPTION 'Reservation amount mismatch.';
        END IF;

        -- Lock voucher
        SELECT * INTO v_voucher FROM public.vouchers WHERE id = v_reservation.voucher_id FOR UPDATE;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Voucher not found.';
        END IF;

        IF v_voucher.status NOT IN ('active', 'partially_used', 'pending_link') THEN
            RAISE EXCEPTION 'Voucher is not active.';
        END IF;

        IF (v_booking.user_id IS NOT NULL AND v_voucher.user_id IS DISTINCT FROM v_booking.user_id) OR
           (v_booking.user_id IS NULL AND v_voucher.user_id IS NOT NULL) THEN
            RAISE EXCEPTION 'Voucher owner mismatch.';
        END IF;

        IF v_voucher.remaining_amount < v_reservation.reserved_amount THEN
            RAISE EXCEPTION 'Insufficient voucher balance.';
        END IF;

        v_balance_before := v_voucher.remaining_amount;
        v_balance_after := v_balance_before - v_reservation.reserved_amount;

        -- Deduct balance and update user_id of the voucher if it was a guest pending_link
        UPDATE public.vouchers SET
            remaining_amount = v_balance_after,
            status = CASE WHEN v_balance_after = 0 THEN 'redeemed' ELSE 'partially_used' END,
            user_id = COALESCE(v_voucher.user_id, v_booking.user_id),
            updated_at = NOW()
        WHERE id = v_voucher.id;

        -- Write redemption audit ledger
        INSERT INTO public.voucher_redemptions (
            reservation_id,
            voucher_id,
            booking_id,
            payment_attempt_id,
            amount_used,
            balance_before,
            balance_after,
            redeemed_by
        ) VALUES (
            v_reservation.id,
            v_voucher.id,
            v_booking.id,
            p_payment_attempt_id,
            v_reservation.reserved_amount,
            v_balance_before,
            v_balance_after,
            v_attempt.user_id
        ) RETURNING id INTO v_redemption_id;

        -- Complete reservation status
        UPDATE public.voucher_reservations SET
            status = 'redeemed',
            updated_at = NOW()
        WHERE id = v_reservation.id;
    ELSE
        -- Without reservation, booking must have no voucher and zero discount
        IF v_booking.voucher_id IS NOT NULL OR COALESCE(v_booking.voucher_discount, 0) IS DISTINCT FROM 0 THEN
            RAISE EXCEPTION 'Booking has voucher discount fields but no reservation is linked to payment attempt.';
        END IF;
    END IF;

    -- 5. Mark booking paid/confirmed
    v_cash_paid := (p_amount_paise::NUMERIC / 100.00);
    UPDATE public.bookings SET
        payment_status = 'paid',
        booking_status = 'confirmed',
        razorpay_payment_id = p_razorpay_payment_id,
        cash_paid_amount = v_cash_paid
    WHERE id = v_attempt.booking_id;

    -- 6. Mark payment attempt verified
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
        'redemption_id', v_redemption_id
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.finalize_verified_payment(UUID, TEXT, TEXT, BIGINT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_verified_payment(UUID, TEXT, TEXT, BIGINT, TEXT) TO service_role;


-- ============================================================================
-- 7. Update public.finalize_full_coupon_checkout
-- ============================================================================

CREATE OR REPLACE FUNCTION public.finalize_full_coupon_checkout(
    p_booking_id UUID,
    p_reservation_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_booking RECORD;
    v_reservation RECORD;
    v_voucher RECORD;
    v_redemption RECORD;
    v_redemption_id UUID;
    v_balance_before NUMERIC(12,2);
    v_balance_after NUMERIC(12,2);
BEGIN
    -- 1. Validate inputs
    IF p_booking_id IS NULL OR p_reservation_id IS NULL THEN
        RAISE EXCEPTION 'Booking ID and Reservation ID are required.';
    END IF;

    -- 2. Lock booking
    SELECT * INTO v_booking FROM public.bookings WHERE id = p_booking_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Booking not found.';
    END IF;

    -- Verify final payable amount is exactly 0 and non-null
    IF v_booking.final_payable_amount IS NULL OR v_booking.final_payable_amount IS DISTINCT FROM 0 THEN
        RAISE EXCEPTION 'Final payable amount must be exactly zero and non-null for full coupon checkout.';
    END IF;

    -- Requires amount_before_voucher > 0
    IF v_booking.amount_before_voucher IS NULL OR v_booking.amount_before_voucher <= 0 THEN
        RAISE EXCEPTION 'amount_before_voucher must be greater than zero.';
    END IF;

    IF v_booking.voucher_discount IS DISTINCT FROM v_booking.amount_before_voucher THEN
        RAISE EXCEPTION 'voucher_discount must equal amount_before_voucher.';
    END IF;

    -- Idempotency check: lookup MUST match BOTH reservation_id and booking_id
    SELECT * INTO v_redemption 
    FROM public.voucher_redemptions 
    WHERE reservation_id = p_reservation_id 
      AND booking_id = p_booking_id;

    IF FOUND THEN
        IF v_booking.payment_status = 'paid' THEN
            RETURN jsonb_build_object(
                'success', true,
                'booking_id', p_booking_id,
                'payment_status', 'paid',
                'redemption_id', v_redemption.id,
                'message', 'Checkout already completed.'
            );
        ELSE
            RAISE EXCEPTION 'Voucher already redeemed but booking is not marked paid.';
        END IF;
    END IF;

    -- Non-idempotent checks
    IF v_booking.payment_status IS DISTINCT FROM 'pending' THEN
        RAISE EXCEPTION 'Booking payment status must be pending.';
    END IF;

    IF v_booking.booking_status IS DISTINCT FROM 'new' AND v_booking.booking_status IS DISTINCT FROM 'contacted' THEN
        RAISE EXCEPTION 'Booking status must be new or contacted.';
    END IF;

    -- Ensure no active/unfinalized payment attempts exist for this booking
    PERFORM id FROM public.payment_attempts WHERE booking_id = p_booking_id LIMIT 1;
    IF FOUND THEN
        RAISE EXCEPTION 'Payment attempts exist for this booking; cannot run full voucher finalization.';
    END IF;

    -- 3. Lock reservation
    SELECT * INTO v_reservation FROM public.voucher_reservations WHERE id = p_reservation_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Voucher reservation not found.';
    END IF;

    IF v_reservation.booking_id IS DISTINCT FROM p_booking_id OR v_reservation.status IS DISTINCT FROM 'pending' THEN
        RAISE EXCEPTION 'Reservation mismatch or is not active.';
    END IF;

    IF v_reservation.expires_at <= NOW() THEN
        RAISE EXCEPTION 'Reservation has expired.';
    END IF;

    -- Verify booking, reservation, voucher and owner IDs match
    IF (v_booking.user_id IS NOT NULL AND v_reservation.user_id IS DISTINCT FROM v_booking.user_id) OR
       (v_booking.user_id IS NULL AND v_reservation.checkout_lead_id IS DISTINCT FROM v_booking.checkout_lead_id) THEN
        RAISE EXCEPTION 'Reservation owner mismatch.';
    END IF;
    IF v_reservation.voucher_id IS DISTINCT FROM v_booking.voucher_id THEN
        RAISE EXCEPTION 'Reservation voucher ID mismatch.';
    END IF;
    IF v_reservation.reserved_amount IS DISTINCT FROM v_booking.voucher_discount THEN
        RAISE EXCEPTION 'Reservation discount amount mismatch.';
    END IF;

    -- 4. Lock voucher
    SELECT * INTO v_voucher FROM public.vouchers WHERE id = v_reservation.voucher_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Voucher not found.';
    END IF;

    IF v_voucher.status NOT IN ('active', 'partially_used', 'pending_link') THEN
        RAISE EXCEPTION 'Voucher status is invalid.';
    END IF;

    IF (v_booking.user_id IS NOT NULL AND v_voucher.user_id IS DISTINCT FROM v_booking.user_id) OR
       (v_booking.user_id IS NULL AND v_voucher.user_id IS NOT NULL) THEN
        RAISE EXCEPTION 'Voucher owner mismatch.';
    END IF;

    IF v_voucher.valid_from > NOW() OR v_voucher.expires_at <= NOW() THEN
        RAISE EXCEPTION 'Voucher validity check failed.';
    END IF;

    IF v_voucher.remaining_amount < v_reservation.reserved_amount THEN
        RAISE EXCEPTION 'Insufficient voucher balance.';
    END IF;

    v_balance_before := v_voucher.remaining_amount;
    v_balance_after := v_balance_before - v_reservation.reserved_amount;

    -- 5. Deduct balance and update user_id of the voucher
    UPDATE public.vouchers SET
        remaining_amount = v_balance_after,
        status = CASE WHEN v_balance_after = 0 THEN 'redeemed' ELSE 'partially_used' END,
        user_id = COALESCE(v_voucher.user_id, v_booking.user_id),
        updated_at = NOW()
    WHERE id = v_voucher.id;

    -- 6. Write redemption record
    INSERT INTO public.voucher_redemptions (
        reservation_id,
        voucher_id,
        booking_id,
        payment_attempt_id,
        amount_used,
        balance_before,
        balance_after,
        redeemed_by
    ) VALUES (
        p_reservation_id,
        v_voucher.id,
        p_booking_id,
        NULL,
        v_reservation.reserved_amount,
        v_balance_before,
        v_balance_after,
        v_booking.user_id
    ) RETURNING id INTO v_redemption_id;

    -- Complete reservation
    UPDATE public.voucher_reservations SET
        status = 'redeemed',
        updated_at = NOW()
    WHERE id = p_reservation_id;

    -- 7. Mark booking paid/confirmed (paid by voucher, cash_paid_amount set to 0)
    UPDATE public.bookings SET
        payment_status = 'paid',
        booking_status = 'confirmed',
        cash_paid_amount = 0
    WHERE id = p_booking_id;

    -- Log activities
    INSERT INTO public.booking_activity_logs (
        booking_id, action, field_name, old_value, new_value, changed_by
    ) VALUES (
        p_booking_id, 'Full Voucher Finalized', 'payment_status', 'pending', 'paid', v_booking.user_id
    );

    RETURN jsonb_build_object(
        'success', true,
        'booking_id', p_booking_id,
        'payment_status', 'paid',
        'redemption_id', v_redemption_id
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.finalize_full_coupon_checkout(UUID, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_full_coupon_checkout(UUID, UUID) TO service_role;


-- ============================================================================
-- 8. Update public.release_checkout_reservation
-- ============================================================================

CREATE OR REPLACE FUNCTION public.release_checkout_reservation(
    p_booking_id UUID,
    p_release_reason TEXT,
    p_gateway_checked_not_paid BOOLEAN
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
    v_released_id UUID := NULL;
BEGIN
    -- 1. Validate inputs
    IF p_booking_id IS NULL THEN
        RAISE EXCEPTION 'Booking ID is required.';
    END IF;

    IF p_release_reason IS NULL OR length(trim(p_release_reason)) = 0 THEN
        RAISE EXCEPTION 'Release reason is required.';
    END IF;

    -- 2. LOCK BOOKING FIRST
    SELECT * INTO v_booking FROM public.bookings WHERE id = p_booking_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Booking not found.';
    END IF;

    -- Reject any verified payment attempt, even if booking status is inconsistent
    PERFORM id FROM public.payment_attempts 
    WHERE booking_id = p_booking_id 
      AND status = 'verified'
    LIMIT 1;
    IF FOUND THEN
        RAISE EXCEPTION 'Cannot release reservation; a verified payment exists.';
    END IF;

    IF v_booking.payment_status = 'paid' THEN
        RAISE EXCEPTION 'Cannot release reservation; booking is already paid.';
    END IF;

    -- 3. LOCK PAYMENT ATTEMPT SECOND
    SELECT * INTO v_attempt 
    FROM public.payment_attempts 
    WHERE booking_id = p_booking_id 
      AND status IN ('preparing', 'order_created', 'verification_pending') FOR UPDATE;

    IF FOUND THEN
        IF v_attempt.status = 'verified' THEN
            RAISE EXCEPTION 'Cannot release reservation; payment attempt is verified.';
        END IF;

        -- preparing status can release directly.
        -- order_created/verification_pending requires gateway_checked_not_paid = true.
        IF v_attempt.status IN ('order_created', 'verification_pending') AND NOT COALESCE(p_gateway_checked_not_paid, false) THEN
            RAISE EXCEPTION 'Cannot release active order without gateway check validation.';
        END IF;

        -- Cancel attempt with supplied reason
        UPDATE public.payment_attempts SET
            status = 'cancelled',
            failure_reason = trim(p_release_reason),
            updated_at = NOW()
        WHERE id = v_attempt.id;
    END IF;

    -- 4. Lock and release reservation
    SELECT * INTO v_reservation 
    FROM public.voucher_reservations 
    WHERE booking_id = p_booking_id 
      AND status IN ('pending', 'payment_pending') FOR UPDATE;

    IF FOUND THEN
        UPDATE public.voucher_reservations SET
            status = 'released',
            updated_at = NOW()
        WHERE id = v_reservation.id;
        v_released_id := v_reservation.id;
    END IF;

    -- Idempotency check: if no active reservation exists and fields are already reset, succeed
    IF NOT FOUND AND v_booking.voucher_id IS NULL AND COALESCE(v_booking.voucher_discount, 0) = 0 THEN
        RETURN jsonb_build_object(
            'success', true,
            'booking_id', p_booking_id,
            'message', 'Reservation already released or none existed.'
        );
    END IF;

    -- 5. Reset booking coupon fields
    UPDATE public.bookings SET
        voucher_id = NULL,
        voucher_discount = 0,
        final_payable_amount = amount_before_voucher
    WHERE id = p_booking_id;

    -- Log activity
    INSERT INTO public.booking_activity_logs (
        booking_id, action, field_name, old_value, new_value, changed_by
    ) VALUES (
        p_booking_id,
        'Voucher Reservation Released',
        'voucher_id',
        v_booking.voucher_id::text,
        NULL,
        v_booking.user_id
    );

    RETURN jsonb_build_object(
        'success', true,
        'booking_id', p_booking_id,
        'released_reservation_id', v_released_id
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.release_checkout_reservation(UUID, TEXT, BOOLEAN) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.release_checkout_reservation(UUID, TEXT, BOOLEAN) TO service_role;

COMMIT;
