-- SQL Migration: Vouchers, Sales Classification and Service Recovery Upgrade
-- Description: Centralized voucher system, B2B/B2C categorization, two-phase voucher reservation/redemption, and secure cancellation workflows.

-- ==========================================
-- 1. BOOKINGS TABLE EXTENSIONS & CONSTRAINTS
-- ==========================================
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS sales_channel TEXT DEFAULT 'unclassified' CHECK (sales_channel IN ('unclassified', 'b2b', 'b2c')),
  ADD COLUMN IF NOT EXISTS b2b_partner_company TEXT,
  ADD COLUMN IF NOT EXISTS b2b_notes TEXT,
  ADD COLUMN IF NOT EXISTS classified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS classified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS voucher_discount NUMERIC(12,2) DEFAULT 0 CHECK (voucher_discount >= 0),
  ADD COLUMN IF NOT EXISTS voucher_id UUID, -- Foreign Key added below
  ADD COLUMN IF NOT EXISTS amount_before_voucher NUMERIC(12,2) CHECK (amount_before_voucher >= 0),
  ADD COLUMN IF NOT EXISTS final_payable_amount NUMERIC(12,2) CHECK (final_payable_amount >= 0),
  ADD COLUMN IF NOT EXISTS checkout_idempotency_key UUID UNIQUE;

-- Constraint: B2B requires non-empty trimmed partner company name
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_b2b_partner_check;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_b2b_partner_check 
  CHECK (sales_channel != 'b2b' OR (b2b_partner_company IS NOT NULL AND length(trim(b2b_partner_company)) > 0));

CREATE INDEX IF NOT EXISTS idx_bookings_sales_channel ON public.bookings (sales_channel);

-- ==========================================
-- 2. BASE VOUCHERS TABLE (NO INTERNAL NOTES)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.vouchers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    source_booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    service_recovery_case_id UUID REFERENCES public.service_recovery_cases(id) ON DELETE SET NULL,
    source_type TEXT NOT NULL CHECK (source_type IN ('cancellation', 'service_recovery')),
    original_amount NUMERIC(12,2) NOT NULL CHECK (original_amount > 0),
    remaining_amount NUMERIC(12,2) NOT NULL CHECK (remaining_amount >= 0 AND remaining_amount <= original_amount),
    issued_reason TEXT,
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending_link', 'active', 'partially_used', 'redeemed', 'expired', 'cancelled')),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    cancelled_at TIMESTAMPTZ,
    cancelled_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    CONSTRAINT check_voucher_dates CHECK (expires_at > valid_from)
);

CREATE INDEX IF NOT EXISTS idx_vouchers_user_id ON public.vouchers (user_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_code ON public.vouchers (code);
CREATE INDEX IF NOT EXISTS idx_vouchers_status ON public.vouchers (status);
CREATE INDEX IF NOT EXISTS idx_vouchers_expires_at ON public.vouchers (expires_at);

-- Update bookings FK reference to vouchers
ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS fk_bookings_voucher_id,
  ADD CONSTRAINT fk_bookings_voucher_id FOREIGN KEY (voucher_id) REFERENCES public.vouchers(id) ON DELETE SET NULL;

-- ==========================================
-- 3. VOUCHER INTERNAL NOTES (ADMIN ONLY TABLE)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.voucher_internal_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voucher_id UUID NOT NULL REFERENCES public.vouchers(id) ON DELETE CASCADE,
    internal_notes TEXT NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_voucher_internal_notes_voucher_id ON public.voucher_internal_notes (voucher_id);

-- ==========================================
-- 4. VOUCHER RESERVATIONS TABLE (TWO-PHASE HOLD)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.voucher_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voucher_id UUID NOT NULL REFERENCES public.vouchers(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reserved_amount NUMERIC(12,2) NOT NULL CHECK (reserved_amount > 0),
    expires_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'released', 'expired')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_voucher_reservations_voucher_id ON public.voucher_reservations (voucher_id);
CREATE INDEX IF NOT EXISTS idx_voucher_reservations_user_id ON public.voucher_reservations (user_id);
CREATE INDEX IF NOT EXISTS idx_voucher_reservations_status ON public.voucher_reservations (status);

-- ==========================================
-- 5. VOUCHER REDEMPTIONS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.voucher_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voucher_id UUID NOT NULL REFERENCES public.vouchers(id) ON DELETE RESTRICT,
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE RESTRICT,
    amount_used NUMERIC(12,2) NOT NULL CHECK (amount_used > 0),
    balance_before NUMERIC(12,2) NOT NULL,
    balance_after NUMERIC(12,2) NOT NULL CHECK (balance_after >= 0),
    redeemed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    redeemed_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT check_redemption_math CHECK (balance_before - amount_used = balance_after)
);

CREATE INDEX IF NOT EXISTS idx_voucher_redemptions_voucher_id ON public.voucher_redemptions (voucher_id);
CREATE INDEX IF NOT EXISTS idx_voucher_redemptions_booking_id ON public.voucher_redemptions (booking_id);

-- ==========================================
-- 6. RLS POLICIES FOR VOUCHERS & RESERVATIONS
-- ==========================================
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voucher_internal_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voucher_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voucher_redemptions ENABLE ROW LEVEL SECURITY;

-- Vouchers table policies: Admin full access only
DROP POLICY IF EXISTS "Admin full access vouchers" ON public.vouchers;
CREATE POLICY "Admin full access vouchers" ON public.vouchers
    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Voucher Internal Notes: Admin full access only
DROP POLICY IF EXISTS "Admin full access internal notes" ON public.voucher_internal_notes;
CREATE POLICY "Admin full access internal notes" ON public.voucher_internal_notes
    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Voucher Reservations policies
DROP POLICY IF EXISTS "Admin full access reservations" ON public.voucher_reservations;
CREATE POLICY "Admin full access reservations" ON public.voucher_reservations
    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Customer view own reservations" ON public.voucher_reservations;
CREATE POLICY "Customer view own reservations" ON public.voucher_reservations
    FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Voucher Redemptions policies
DROP POLICY IF EXISTS "Admin full access redemptions" ON public.voucher_redemptions;
CREATE POLICY "Admin full access redemptions" ON public.voucher_redemptions
    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Customer view own redemptions" ON public.voucher_redemptions;
CREATE POLICY "Customer view own redemptions" ON public.voucher_redemptions
    FOR SELECT TO authenticated USING (
      EXISTS (SELECT 1 FROM public.vouchers v WHERE v.id = voucher_redemptions.voucher_id AND v.user_id = auth.uid())
    );

-- ==========================================
-- 7. SECURE VIEW FOR CUSTOMERS
-- ==========================================
DROP VIEW IF EXISTS public.customer_vouchers_view;
CREATE VIEW public.customer_vouchers_view WITH (security_invoker = true) AS
SELECT 
    v.id, 
    v.code, 
    v.user_id, 
    v.source_booking_id, 
    v.service_recovery_case_id, 
    v.source_type, 
    v.original_amount, 
    v.remaining_amount, 
    v.issued_reason, 
    v.valid_from, 
    v.expires_at, 
    v.status, 
    v.created_at, 
    v.updated_at, 
    v.cancelled_at 
FROM public.vouchers v
WHERE v.user_id = (SELECT auth.uid())
  AND v.user_id IS NOT NULL
  AND v.status NOT IN ('pending_link', 'cancelled');

REVOKE ALL ON public.customer_vouchers_view FROM PUBLIC, anon;
GRANT SELECT ON public.customer_vouchers_view TO authenticated;

-- ==========================================
-- 8. RPC: PHASE A - RESERVE VOUCHER FOR CHECKOUT
-- ==========================================
CREATE OR REPLACE FUNCTION public.reserve_voucher_for_checkout(
    p_voucher_code TEXT,
    p_requested_amount NUMERIC,
    p_booking_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_user_id UUID;
    v_voucher RECORD;
    v_active_reserved NUMERIC(12,2) := 0;
    v_available_balance NUMERIC(12,2) := 0;
    v_effective_discount NUMERIC(12,2) := 0;
    v_reservation_id UUID;
    v_reservation_expiry TIMESTAMPTZ;
BEGIN
    v_user_id := (SELECT auth.uid());
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Must be authenticated.';
    END IF;

    IF p_requested_amount <= 0 THEN
        RAISE EXCEPTION 'Requested voucher amount must be greater than zero.';
    END IF;

    -- Lock voucher
    SELECT * INTO v_voucher FROM public.vouchers WHERE code = trim(p_voucher_code) FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid voucher code.';
    END IF;

    -- Strict NULL ownership check
    IF v_voucher.user_id IS NULL OR v_voucher.user_id IS DISTINCT FROM v_user_id THEN
        RAISE EXCEPTION 'Unauthorized: This voucher does not belong to your account.';
    END IF;

    IF v_voucher.status NOT IN ('active', 'partially_used') THEN
        RAISE EXCEPTION 'Voucher is not active (Status: %).', v_voucher.status;
    END IF;

    IF v_voucher.expires_at <= NOW() THEN
        UPDATE public.vouchers SET status = 'expired', updated_at = NOW() WHERE id = v_voucher.id;
        RAISE EXCEPTION 'Voucher has expired.';
    END IF;

    -- Calculate active reservations for this voucher
    SELECT COALESCE(SUM(reserved_amount), 0) INTO v_active_reserved
    FROM public.voucher_reservations
    WHERE voucher_id = v_voucher.id
      AND status = 'pending'
      AND expires_at > NOW();

    v_available_balance := v_voucher.remaining_amount - v_active_reserved;

    IF v_available_balance <= 0 THEN
        RAISE EXCEPTION 'Voucher has no available balance due to pending reservations.';
    END IF;

    v_effective_discount := LEAST(p_requested_amount, v_available_balance);

    -- Release any previous pending reservations for this user and voucher
    UPDATE public.voucher_reservations
    SET status = 'released', updated_at = NOW()
    WHERE voucher_id = v_voucher.id
      AND user_id = v_user_id
      AND status = 'pending';

    -- Insert new reservation with 15-minute expiry
    v_reservation_expiry := NOW() + INTERVAL '15 minutes';
    INSERT INTO public.voucher_reservations (
        voucher_id, booking_id, user_id, reserved_amount, expires_at, status
    ) VALUES (
        v_voucher.id, p_booking_id, v_user_id, v_effective_discount, v_reservation_expiry, 'pending'
    ) RETURNING id INTO v_reservation_id;

    RETURN jsonb_build_object(
        'success', true,
        'reservation_id', v_reservation_id,
        'voucher_id', v_voucher.id,
        'voucher_code', v_voucher.code,
        'reserved_amount', v_effective_discount,
        'voucher_remaining_balance', v_voucher.remaining_amount,
        'available_balance_after_hold', v_available_balance - v_effective_discount,
        'expires_at', v_reservation_expiry
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.reserve_voucher_for_checkout(TEXT, NUMERIC, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reserve_voucher_for_checkout(TEXT, NUMERIC, UUID) TO authenticated;

-- ==========================================
-- 9. RPC: RELEASE VOUCHER RESERVATION
-- ==========================================
CREATE OR REPLACE FUNCTION public.release_voucher_reservation(
    p_reservation_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_user_id UUID;
    v_reservation RECORD;
BEGIN
    v_user_id := (SELECT auth.uid());
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Must be authenticated.';
    END IF;

    SELECT * INTO v_reservation FROM public.voucher_reservations WHERE id = p_reservation_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Reservation not found.');
    END IF;

    IF v_reservation.user_id IS DISTINCT FROM v_user_id AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Cannot release another user reservation.';
    END IF;

    IF v_reservation.status = 'pending' THEN
        UPDATE public.voucher_reservations 
        SET status = 'released', updated_at = NOW() 
        WHERE id = p_reservation_id;
    END IF;

    RETURN jsonb_build_object('success', true, 'reservation_id', p_reservation_id);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.release_voucher_reservation(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.release_voucher_reservation(UUID) TO authenticated;

-- ==========================================
-- 10. RPC: PHASE B - FINALIZE VOUCHER REDEMPTION
-- ==========================================
CREATE OR REPLACE FUNCTION public.finalize_voucher_redemption(
    p_reservation_id UUID,
    p_booking_id UUID,
    p_razorpay_payment_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_user_id UUID;
    v_reservation RECORD;
    v_voucher RECORD;
    v_booking RECORD;
    v_balance_before NUMERIC(12,2);
    v_balance_after NUMERIC(12,2);
    v_new_status TEXT;
    v_amount_before NUMERIC(12,2);
    v_final_payable NUMERIC(12,2);
BEGIN
    v_user_id := (SELECT auth.uid());
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Must be authenticated.';
    END IF;

    -- 1. Lock reservation
    SELECT * INTO v_reservation FROM public.voucher_reservations WHERE id = p_reservation_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Voucher reservation not found.';
    END IF;

    IF v_reservation.status != 'pending' THEN
        RAISE EXCEPTION 'Reservation is not active (Status: %).', v_reservation.status;
    END IF;

    IF v_reservation.expires_at <= NOW() THEN
        UPDATE public.voucher_reservations SET status = 'expired', updated_at = NOW() WHERE id = p_reservation_id;
        RAISE EXCEPTION 'Voucher reservation has expired.';
    END IF;

    IF v_reservation.user_id IS DISTINCT FROM v_user_id AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: You do not own this voucher reservation.';
    END IF;

    -- 2. Lock voucher
    SELECT * INTO v_voucher FROM public.vouchers WHERE id = v_reservation.voucher_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Voucher not found.';
    END IF;

    IF v_voucher.user_id IS NULL OR (v_voucher.user_id IS DISTINCT FROM v_user_id AND NOT public.is_admin()) THEN
        RAISE EXCEPTION 'Unauthorized: You do not own this voucher.';
    END IF;

    -- 3. Lock booking
    SELECT * INTO v_booking FROM public.bookings WHERE id = p_booking_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Booking not found.';
    END IF;

    IF v_booking.user_id IS NULL OR (v_booking.user_id IS DISTINCT FROM v_user_id AND NOT public.is_admin()) THEN
        RAISE EXCEPTION 'Unauthorized: Booking ownership mismatch.';
    END IF;

    IF v_voucher.source_booking_id IS NOT NULL AND v_voucher.source_booking_id = p_booking_id THEN
        RAISE EXCEPTION 'Cannot apply a cancellation voucher to its original booking.';
    END IF;

    -- 4. Calculate deduction & balance
    v_balance_before := v_voucher.remaining_amount;
    IF v_balance_before < v_reservation.reserved_amount THEN
        RAISE EXCEPTION 'Insufficient voucher balance (Available: %, Reserved: %).', v_balance_before, v_reservation.reserved_amount;
    END IF;

    v_balance_after := v_balance_before - v_reservation.reserved_amount;
    v_new_status := CASE WHEN v_balance_after = 0 THEN 'redeemed' ELSE 'partially_used' END;

    -- 5. Deduct voucher balance
    UPDATE public.vouchers SET
        remaining_amount = v_balance_after,
        status = v_new_status,
        updated_at = NOW()
    WHERE id = v_voucher.id;

    -- 6. Insert Redemption record
    INSERT INTO public.voucher_redemptions (
        voucher_id, booking_id, amount_used, balance_before, balance_after, redeemed_by
    ) VALUES (
        v_voucher.id, p_booking_id, v_reservation.reserved_amount, v_balance_before, v_balance_after, v_user_id
    );

    -- 7. Update Booking Financial Fields
    v_amount_before := COALESCE(v_booking.amount_before_voucher, v_booking.total_amount);
    v_final_payable := GREATEST(0, v_amount_before - v_reservation.reserved_amount);

    UPDATE public.bookings SET
        voucher_id = v_voucher.id,
        voucher_discount = v_reservation.reserved_amount,
        amount_before_voucher = v_amount_before,
        final_payable_amount = v_final_payable,
        razorpay_payment_id = COALESCE(p_razorpay_payment_id, v_booking.razorpay_payment_id),
        payment_status = CASE WHEN v_final_payable = 0 OR p_razorpay_payment_id IS NOT NULL THEN 'paid' ELSE v_booking.payment_status END,
        booking_status = 'confirmed'
    WHERE id = p_booking_id;

    -- 8. Complete reservation
    UPDATE public.voucher_reservations SET
        status = 'completed',
        booking_id = p_booking_id,
        updated_at = NOW()
    WHERE id = p_reservation_id;

    -- 9. Log activity
    INSERT INTO public.booking_activity_logs (
        booking_id, action, field_name, old_value, new_value, changed_by
    ) VALUES (
        p_booking_id, 'Voucher Finalized', 'voucher_discount', '0', v_reservation.reserved_amount::text, v_user_id
    );

    RETURN jsonb_build_object(
        'success', true,
        'booking_id', p_booking_id,
        'voucher_id', v_voucher.id,
        'reserved_amount', v_reservation.reserved_amount,
        'balance_before', v_balance_before,
        'balance_after', v_balance_after,
        'final_payable_amount', v_final_payable
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.finalize_voucher_redemption(UUID, UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.finalize_voucher_redemption(UUID, UUID, TEXT) TO authenticated;

-- ==========================================
-- 11. RPC: CANCEL BOOKING WITH VOUCHER (ADMIN ONLY)
-- ==========================================
CREATE OR REPLACE FUNCTION public.cancel_booking_with_voucher(
    p_booking_id UUID,
    p_cancellation_reason TEXT,
    p_refund_status TEXT,
    p_cancellation_notes TEXT,
    p_issue_voucher BOOLEAN,
    p_voucher_amount NUMERIC,
    p_voucher_expiry TIMESTAMPTZ,
    p_voucher_notes TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_admin_id UUID;
    v_booking RECORD;
    v_actual_paid NUMERIC(12,2) := 0;
    v_voucher_code TEXT;
    v_voucher_status TEXT;
    v_voucher_id UUID;
    v_result JSONB;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can perform this action.';
    END IF;

    v_admin_id := (SELECT auth.uid());

    -- Validate input parameters
    IF p_cancellation_reason IS NULL OR length(trim(p_cancellation_reason)) = 0 THEN
        RAISE EXCEPTION 'Cancellation reason is required.';
    END IF;

    -- Lock and retrieve booking
    SELECT * INTO v_booking FROM public.bookings WHERE id = p_booking_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Booking not found.';
    END IF;

    IF v_booking.booking_status = 'cancelled' THEN
        RAISE EXCEPTION 'Booking is already cancelled.';
    END IF;

    -- Calculate actual paid amount from booking financial status
    v_actual_paid := CASE 
        WHEN v_booking.payment_status = 'paid' THEN COALESCE(v_booking.final_payable_amount, v_booking.total_amount)
        WHEN v_booking.payment_status = 'partially_paid' THEN COALESCE(v_booking.advance_paid, 0)
        ELSE 0
    END;

    -- Voucher creation logic if requested
    IF p_issue_voucher THEN
        IF p_voucher_amount IS NULL OR p_voucher_amount <= 0 THEN
            RAISE EXCEPTION 'Voucher amount must be a positive number.';
        END IF;

        IF p_voucher_amount > v_actual_paid THEN
            RAISE EXCEPTION 'Voucher amount (%) cannot exceed actual paid amount (%).', p_voucher_amount, v_actual_paid;
        END IF;

        IF p_voucher_expiry IS NULL OR p_voucher_expiry <= NOW() THEN
            RAISE EXCEPTION 'Voucher expiry date must be in the future.';
        END IF;

        -- Generate 12-char secure code with collision retry
        FOR i IN 1..10 LOOP
            v_voucher_code := 'TRIPO-' || upper(encode(gen_random_bytes(6), 'hex'));
            v_voucher_status := CASE WHEN v_booking.user_id IS NULL THEN 'pending_link' ELSE 'active' END;

            BEGIN
                INSERT INTO public.vouchers (
                    code, user_id, source_booking_id, source_type, 
                    original_amount, remaining_amount, issued_reason, 
                    expires_at, status, created_by
                ) VALUES (
                    v_voucher_code, v_booking.user_id, v_booking.id, 'cancellation',
                    p_voucher_amount, p_voucher_amount, p_cancellation_reason,
                    p_voucher_expiry, v_voucher_status, v_admin_id
                ) RETURNING id INTO v_voucher_id;
                EXIT;
            EXCEPTION WHEN unique_violation THEN
                IF i = 10 THEN
                    RAISE EXCEPTION 'Failed to generate unique voucher code.';
                END IF;
            END BEGIN;
        END LOOP;

        -- Insert internal notes securely if provided
        IF p_voucher_notes IS NOT NULL AND length(trim(p_voucher_notes)) > 0 THEN
            INSERT INTO public.voucher_internal_notes (
                voucher_id, internal_notes, created_by
            ) VALUES (
                v_voucher_id, p_voucher_notes, v_admin_id
            );
        END IF;
        
        -- Log activity for voucher
        INSERT INTO public.booking_activity_logs (
            booking_id, action, field_name, new_value, changed_by
        ) VALUES (
            p_booking_id, 'Cancellation Voucher Issued', 'voucher_code', v_voucher_code, v_admin_id
        );
    END IF;

    -- Update booking status
    UPDATE public.bookings SET
        booking_status = 'cancelled',
        cancellation_reason = p_cancellation_reason,
        cancellation_notes = p_cancellation_notes,
        refund_status = p_refund_status,
        cancelled_at = NOW(),
        cancelled_by = v_admin_id
    WHERE id = p_booking_id;

    -- Log activity for cancellation
    INSERT INTO public.booking_activity_logs (
        booking_id, action, field_name, old_value, new_value, changed_by
    ) VALUES (
        p_booking_id, 'Booking Cancelled', 'booking_status', v_booking.booking_status, 'cancelled (Reason: ' || p_cancellation_reason || ')', v_admin_id
    );

    v_result := jsonb_build_object(
        'success', true,
        'booking_id', p_booking_id,
        'voucher_id', v_voucher_id,
        'voucher_code', v_voucher_code,
        'actual_paid_amount', v_actual_paid
    );

    RETURN v_result;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.cancel_booking_with_voucher(UUID, TEXT, TEXT, TEXT, BOOLEAN, NUMERIC, TIMESTAMPTZ, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancel_booking_with_voucher(UUID, TEXT, TEXT, TEXT, BOOLEAN, NUMERIC, TIMESTAMPTZ, TEXT) TO authenticated;

-- ==========================================
-- 12. RPC: CREATE SERVICE RECOVERY WITH VOUCHER (ADMIN ONLY)
-- ==========================================
CREATE OR REPLACE FUNCTION public.create_service_recovery_with_voucher(
    p_booking_id UUID,
    p_issue_title TEXT,
    p_issue_description TEXT,
    p_priority TEXT,
    p_incident_date DATE,
    p_internal_notes TEXT,
    p_issue_voucher BOOLEAN,
    p_voucher_amount NUMERIC,
    p_voucher_expiry TIMESTAMPTZ,
    p_voucher_notes TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_admin_id UUID;
    v_booking RECORD;
    v_case_id UUID;
    v_existing_count INT := 0;
    v_voucher_code TEXT;
    v_voucher_status TEXT;
    v_voucher_id UUID;
    v_result JSONB;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can perform this action.';
    END IF;

    v_admin_id := (SELECT auth.uid());

    -- Input validations
    IF p_issue_title IS NULL OR length(trim(p_issue_title)) = 0 THEN
        RAISE EXCEPTION 'Issue title is required.';
    END IF;
    IF p_issue_description IS NULL OR length(trim(p_issue_description)) = 0 THEN
        RAISE EXCEPTION 'Issue description is required.';
    END IF;
    IF p_priority NOT IN ('low', 'medium', 'high', 'urgent') THEN
        RAISE EXCEPTION 'Invalid priority level.';
    END IF;
    IF p_incident_date > CURRENT_DATE THEN
        RAISE EXCEPTION 'Incident date cannot be in the future.';
    END IF;

    -- Retrieve booking
    SELECT * INTO v_booking FROM public.bookings WHERE id = p_booking_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Booking not found.';
    END IF;

    -- Prevent duplicate active service recovery vouchers for this booking
    IF p_issue_voucher THEN
        SELECT COUNT(*) INTO v_existing_count 
        FROM public.vouchers 
        WHERE source_booking_id = p_booking_id 
          AND source_type = 'service_recovery'
          AND status NOT IN ('cancelled', 'expired');

        IF v_existing_count > 0 THEN
            RAISE EXCEPTION 'An active service recovery voucher has already been issued for this booking.';
        END IF;

        IF p_voucher_amount IS NULL OR p_voucher_amount <= 0 THEN
            RAISE EXCEPTION 'Voucher amount must be positive.';
        END IF;

        IF p_voucher_expiry IS NULL OR p_voucher_expiry <= NOW() THEN
            RAISE EXCEPTION 'Voucher expiry must be in the future.';
        END IF;
    END IF;

    -- Create Service Recovery Case
    INSERT INTO public.service_recovery_cases (
        user_id, booking_id, issue_title, issue_description, priority, 
        incident_date, internal_notes, created_by
    ) VALUES (
        v_booking.user_id, p_booking_id, p_issue_title, p_issue_description, p_priority,
        p_incident_date, p_internal_notes, v_admin_id
    ) RETURNING id INTO v_case_id;

    -- Issue Voucher if requested
    IF p_issue_voucher THEN
        FOR i IN 1..10 LOOP
            v_voucher_code := 'TRIPO-' || upper(encode(gen_random_bytes(6), 'hex'));
            v_voucher_status := CASE WHEN v_booking.user_id IS NULL THEN 'pending_link' ELSE 'active' END;

            BEGIN
                INSERT INTO public.vouchers (
                    code, user_id, source_booking_id, service_recovery_case_id, source_type, 
                    original_amount, remaining_amount, issued_reason, 
                    expires_at, status, created_by
                ) VALUES (
                    v_voucher_code, v_booking.user_id, p_booking_id, v_case_id, 'service_recovery',
                    p_voucher_amount, p_voucher_amount, p_issue_title,
                    p_voucher_expiry, v_voucher_status, v_admin_id
                ) RETURNING id INTO v_voucher_id;
                EXIT;
            EXCEPTION WHEN unique_violation THEN
                IF i = 10 THEN
                    RAISE EXCEPTION 'Failed to generate unique voucher code.';
                END IF;
            END BEGIN;
        END LOOP;

        IF p_voucher_notes IS NOT NULL AND length(trim(p_voucher_notes)) > 0 THEN
            INSERT INTO public.voucher_internal_notes (
                voucher_id, internal_notes, created_by
            ) VALUES (
                v_voucher_id, p_voucher_notes, v_admin_id
            );
        END IF;

        INSERT INTO public.booking_activity_logs (
            booking_id, action, field_name, new_value, changed_by
        ) VALUES (
            p_booking_id, 'Service Recovery Voucher Issued', 'voucher_code', v_voucher_code, v_admin_id
        );
    END IF;

    INSERT INTO public.booking_activity_logs (
        booking_id, action, field_name, new_value, changed_by
    ) VALUES (
        p_booking_id, 'Service Recovery Case Created', 'service_recovery_id', v_case_id::text, v_admin_id
    );

    v_result := jsonb_build_object(
        'success', true,
        'case_id', v_case_id,
        'voucher_id', v_voucher_id,
        'voucher_code', v_voucher_code
    );

    RETURN v_result;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_service_recovery_with_voucher(UUID, TEXT, TEXT, TEXT, DATE, TEXT, BOOLEAN, NUMERIC, TIMESTAMPTZ, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_service_recovery_with_voucher(UUID, TEXT, TEXT, TEXT, DATE, TEXT, BOOLEAN, NUMERIC, TIMESTAMPTZ, TEXT) TO authenticated;

-- ==========================================
-- 13. RPC: RESOLVE SERVICE RECOVERY WITH VOUCHER (ADMIN ONLY)
-- ==========================================
CREATE OR REPLACE FUNCTION public.resolve_service_recovery_with_voucher(
    p_case_id UUID,
    p_resolution_notes TEXT,
    p_voucher_amount NUMERIC,
    p_voucher_expiry TIMESTAMPTZ,
    p_voucher_notes TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_admin_id UUID;
    v_case RECORD;
    v_booking RECORD;
    v_existing_count INT := 0;
    v_voucher_code TEXT;
    v_voucher_status TEXT;
    v_voucher_id UUID;
    v_result JSONB;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can perform this action.';
    END IF;

    v_admin_id := (SELECT auth.uid());

    SELECT * INTO v_case FROM public.service_recovery_cases WHERE id = p_case_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Service recovery case not found.';
    END IF;

    SELECT * INTO v_booking FROM public.bookings WHERE id = v_case.booking_id;

    IF p_voucher_amount > 0 THEN
        -- Prevent duplicate active service recovery vouchers for this case
        SELECT COUNT(*) INTO v_existing_count 
        FROM public.vouchers 
        WHERE service_recovery_case_id = p_case_id 
          AND status NOT IN ('cancelled', 'expired');

        IF v_existing_count > 0 THEN
            RAISE EXCEPTION 'A voucher has already been issued for this Service Recovery case.';
        END IF;

        IF p_voucher_expiry IS NULL OR p_voucher_expiry <= NOW() THEN
            RAISE EXCEPTION 'Voucher expiry must be in the future.';
        END IF;

        FOR i IN 1..10 LOOP
            v_voucher_code := 'TRIPO-' || upper(encode(gen_random_bytes(6), 'hex'));
            v_voucher_status := CASE WHEN v_booking.user_id IS NULL THEN 'pending_link' ELSE 'active' END;

            BEGIN
                INSERT INTO public.vouchers (
                    code, user_id, source_booking_id, service_recovery_case_id, source_type, 
                    original_amount, remaining_amount, issued_reason, 
                    expires_at, status, created_by
                ) VALUES (
                    v_voucher_code, v_booking.user_id, v_booking.id, v_case.id, 'service_recovery',
                    p_voucher_amount, p_voucher_amount, v_case.issue_title,
                    p_voucher_notes, p_voucher_expiry, v_voucher_status, v_admin_id
                ) RETURNING id INTO v_voucher_id;
                EXIT;
            EXCEPTION WHEN unique_violation THEN
                IF i = 10 THEN
                    RAISE EXCEPTION 'Failed to generate unique voucher code.';
                END IF;
            END BEGIN;
        END LOOP;

        IF p_voucher_notes IS NOT NULL AND length(trim(p_voucher_notes)) > 0 THEN
            INSERT INTO public.voucher_internal_notes (
                voucher_id, internal_notes, created_by
            ) VALUES (
                v_voucher_id, p_voucher_notes, v_admin_id
            );
        END IF;
        
        INSERT INTO public.booking_activity_logs (
            booking_id, action, field_name, new_value, changed_by
        ) VALUES (
            v_booking.id, 'Service Recovery Voucher Issued', 'voucher_code', v_voucher_code, v_admin_id
        );
    END IF;

    UPDATE public.service_recovery_cases SET
        status = 'resolved',
        resolution_notes = p_resolution_notes,
        resolved_at = NOW()
    WHERE id = p_case_id;

    v_result := jsonb_build_object(
        'success', true,
        'voucher_id', v_voucher_id,
        'voucher_code', v_voucher_code
    );

    RETURN v_result;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.resolve_service_recovery_with_voucher(UUID, TEXT, NUMERIC, TIMESTAMPTZ, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.resolve_service_recovery_with_voucher(UUID, TEXT, NUMERIC, TIMESTAMPTZ, TEXT) TO authenticated;
