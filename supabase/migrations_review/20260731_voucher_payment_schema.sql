BEGIN;

-- ============================================================================
-- TripoMist: Voucher & Payment Schema Migration
-- File:    20260731_voucher_payment_schema.sql
-- Phase:   SCHEMA ONLY
-- Status:  REVIEW DRAFT — NOT YET APPROVED FOR EXECUTION
-- Author:  Schema Audit 2026-07-31 (corrected)
-- ============================================================================
--
-- THIS FILE ONLY ADDS SCHEMA AND RLS.
-- IT MUST NOT BE RUN YET.
-- THE FOLLOWING MUST ALL BE REVIEWED FIRST:
--   - Separate future RPC migration
--   - Edge Function (razorpay-checkout)
--   - Frontend checkout flow
--
-- LIVE SCHEMA FACTS USED (verified read-only audit 2026-07-31):
--   bookings.id                  UUID
--   bookings.package_id          INTEGER  (frontend casts to parseInt)
--   bookings.travellers          INTEGER  (existing column name)
--   bookings.selected_sharing    TEXT
--   bookings.total_amount        NUMERIC
--   bookings.final_amount        NUMERIC
--   bookings.razorpay_payment_id TEXT UNIQUE
--   bookings.advance_payment     NUMERIC
--   bookings.payment_status:     pending | paid | refunded | failed
--   bookings.booking_status:     new | contacted | confirmed | cancelled | completed
--   Pakage.id                    BIGINT
--   service_recovery_cases.id    UUID, booking_id UUID, existing admin RLS secure
-- ============================================================================


-- ============================================================================
-- SECTION A: BOOKINGS TABLE EXTENSIONS
-- ============================================================================

-- Sales classification columns
ALTER TABLE public.bookings
    ADD COLUMN IF NOT EXISTS sales_channel         TEXT    DEFAULT 'unclassified'
        CHECK (sales_channel IN ('unclassified', 'b2b', 'b2c')),
    ADD COLUMN IF NOT EXISTS b2b_partner_company   TEXT,
    ADD COLUMN IF NOT EXISTS b2b_notes             TEXT,
    ADD COLUMN IF NOT EXISTS classified_by         UUID    REFERENCES auth.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS classified_at         TIMESTAMPTZ;

-- Voucher-related financial columns
ALTER TABLE public.bookings
    ADD COLUMN IF NOT EXISTS amount_before_voucher  NUMERIC(12,2)
        CHECK (amount_before_voucher >= 0),
    ADD COLUMN IF NOT EXISTS voucher_discount        NUMERIC(12,2) DEFAULT 0
        CHECK (voucher_discount >= 0),
    ADD COLUMN IF NOT EXISTS final_payable_amount    NUMERIC(12,2)
        CHECK (final_payable_amount >= 0),
    -- Removed DEFAULT 0: existing bookings remain NULL to signify legacy status.
    ADD COLUMN IF NOT EXISTS cash_paid_amount        NUMERIC(12,2)
        CHECK (cash_paid_amount >= 0);

-- Checkout idempotency key — plain UUID column; uniqueness enforced by partial
-- index below, so NULL values on legacy rows do not violate the constraint.
-- Do NOT use ADD COLUMN ... UNIQUE — that would require all NULLs to be distinct
-- in some Postgres versions and complicates back-fills.
ALTER TABLE public.bookings
    ADD COLUMN IF NOT EXISTS checkout_idempotency_key UUID;

-- Partial unique index: only non-null keys must be unique
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_checkout_idempotency_key_unique
    ON public.bookings (checkout_idempotency_key)
    WHERE checkout_idempotency_key IS NOT NULL;

-- voucher_id FK placeholder — plain UUID; FK constraint added after vouchers
-- table is created later in this same migration.
ALTER TABLE public.bookings
    ADD COLUMN IF NOT EXISTS voucher_id UUID;

-- NOTE: Do NOT add payment_id. Use existing razorpay_payment_id column.

-- B2B constraint: when sales_channel = 'b2b', partner company must be non-empty
ALTER TABLE public.bookings
    DROP CONSTRAINT IF EXISTS bookings_b2b_partner_check;
ALTER TABLE public.bookings
    ADD CONSTRAINT bookings_b2b_partner_check
        CHECK (
            sales_channel != 'b2b'
            OR (b2b_partner_company IS NOT NULL AND length(trim(b2b_partner_company)) > 0)
        );

-- Voucher math constraint: when voucher columns are populated, the arithmetic
-- must be exact. All three fields are nullable so legacy bookings are unaffected.
-- Corrected: voucher_discount has DEFAULT 0, so legacy check uses COALESCE(voucher_discount, 0) = 0.
ALTER TABLE public.bookings
    DROP CONSTRAINT IF EXISTS bookings_voucher_math_check;
ALTER TABLE public.bookings
    ADD CONSTRAINT bookings_voucher_math_check
        CHECK (
            -- Allow legacy rows where none of the financial fields are populated
            (
                amount_before_voucher IS NULL
                AND final_payable_amount IS NULL
                AND COALESCE(voucher_discount, 0) = 0
            )
            OR (
                -- When any are populated: discount must not exceed before-voucher amount
                -- and final = before - discount must hold exactly
                amount_before_voucher IS NOT NULL
                AND voucher_discount IS NOT NULL
                AND final_payable_amount IS NOT NULL
                AND voucher_discount <= amount_before_voucher
                AND final_payable_amount = amount_before_voucher - voucher_discount
            )
        );

CREATE INDEX IF NOT EXISTS idx_bookings_sales_channel
    ON public.bookings (sales_channel);


-- ============================================================================
-- SECTION B: VOUCHERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.vouchers (
    id                        UUID          PRIMARY KEY DEFAULT gen_random_uuid(),

    -- code: NOT NULL; case-insensitive uniqueness enforced by index on UPPER(code)
    -- Normalized check constraint applied below.
    code                      TEXT          NOT NULL,

    -- Ownership: nullable ONLY for pending_link vouchers (guest bookings).
    -- active, partially_used and redeemed vouchers MUST have a user_id.
    user_id                   UUID          REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Source traceability
    -- source_booking_id is NOT NULL — every voucher must trace back to a booking.
    -- ON DELETE RESTRICT prevents deleting the origin booking while vouchers exist.
    source_booking_id         UUID          NOT NULL
        REFERENCES public.bookings(id) ON DELETE RESTRICT,

    -- service_recovery_case_id is nullable; populated only for service_recovery type
    -- Changed ON DELETE SET NULL to ON DELETE RESTRICT to preserve the audit trail
    service_recovery_case_id  UUID
        REFERENCES public.service_recovery_cases(id) ON DELETE RESTRICT,

    -- Only these two sources are permitted
    source_type               TEXT          NOT NULL
        CHECK (source_type IN ('cancellation', 'service_recovery')),

    -- Financial amounts
    original_amount           NUMERIC(12,2) NOT NULL CHECK (original_amount > 0),
    remaining_amount          NUMERIC(12,2) NOT NULL
        CHECK (remaining_amount >= 0 AND remaining_amount <= original_amount),

    -- Descriptive fields
    issued_reason             TEXT,

    -- Validity window
    valid_from                TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    expires_at                TIMESTAMPTZ   NOT NULL,

    -- Status lifecycle
    -- pending_link  : issued for guest booking; user_id MUST be NULL
    -- active        : linked to user; user_id MUST be set; remaining_amount > 0
    -- partially_used: user_id MUST be set; remaining_amount > 0
    -- redeemed      : user_id MUST be set; remaining_amount MUST be 0
    -- expired       : past expires_at; user_id may or may not be set
    -- cancelled     : voided by admin; user_id may or may not be set
    status                    TEXT          NOT NULL DEFAULT 'active'
        CHECK (status IN (
            'pending_link',
            'active',
            'partially_used',
            'redeemed',
            'expired',
            'cancelled'
        )),

    -- Audit trail
    created_by                UUID          REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at                TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at                TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    -- Cancellation audit
    cancelled_by              UUID          REFERENCES auth.users(id) ON DELETE SET NULL,
    cancelled_at              TIMESTAMPTZ,

    -- === INTEGRITY CONSTRAINTS ===

    -- Validity window order
    CONSTRAINT check_voucher_dates
        CHECK (expires_at > valid_from),

    -- Normalized coupon code check: code must be uppercase, trimmed, and non-empty
    CONSTRAINT check_voucher_code_normalized
        CHECK (code = UPPER(BTRIM(code)) AND length(code) > 0),

    -- Source consistency:
    --   cancellation     => service_recovery_case_id must be NULL
    --   service_recovery => service_recovery_case_id must be set
    CONSTRAINT check_voucher_source_consistency
        CHECK (
            (source_type = 'cancellation'     AND service_recovery_case_id IS NULL)
            OR
            (source_type = 'service_recovery' AND service_recovery_case_id IS NOT NULL)
        ),

    -- Ownership rules per status:
    --   pending_link must have user_id NULL
    --   active / partially_used / redeemed must have user_id NOT NULL
    --   expired / cancelled: no restriction on user_id
    CONSTRAINT check_voucher_user_id_by_status
        CHECK (
            (status = 'pending_link'   AND user_id IS NULL)
            OR (status IN ('active', 'partially_used', 'redeemed') AND user_id IS NOT NULL)
            OR (status IN ('expired', 'cancelled'))
        ),

    -- Balance rules per status:
    --   redeemed        => remaining_amount must be exactly 0
    --   active          => remaining_amount must be > 0
    --   partially_used  => remaining_amount must be > 0
    CONSTRAINT check_voucher_balance_by_status
        CHECK (
            (status = 'redeemed'       AND remaining_amount = 0)
            OR (status IN ('active', 'partially_used') AND remaining_amount > 0)
            OR (status IN ('pending_link', 'expired', 'cancelled'))
        )
);

-- Case-insensitive unique index on code (replaces column-level UNIQUE)
CREATE UNIQUE INDEX IF NOT EXISTS idx_vouchers_code_upper
    ON public.vouchers (UPPER(code));

CREATE INDEX IF NOT EXISTS idx_vouchers_user_id    ON public.vouchers (user_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_status     ON public.vouchers (status);
CREATE INDEX IF NOT EXISTS idx_vouchers_expires_at ON public.vouchers (expires_at);

-- Now that vouchers table exists, add the FK from bookings.voucher_id
ALTER TABLE public.bookings
    DROP CONSTRAINT IF EXISTS fk_bookings_voucher_id;
ALTER TABLE public.bookings
    ADD CONSTRAINT fk_bookings_voucher_id
        FOREIGN KEY (voucher_id) REFERENCES public.vouchers(id) ON DELETE SET NULL;


-- ============================================================================
-- SECTION C: VOUCHER INTERNAL NOTES (admin-only, separate from vouchers)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.voucher_internal_notes (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    voucher_id     UUID        NOT NULL REFERENCES public.vouchers(id) ON DELETE CASCADE,
    internal_notes TEXT        NOT NULL CHECK (length(trim(internal_notes)) > 0),
    created_by     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_voucher_internal_notes_voucher_id
    ON public.voucher_internal_notes (voucher_id);


-- ============================================================================
-- SECTION D: VOUCHER RESERVATIONS
-- ============================================================================
-- A reservation temporarily holds a portion of voucher balance during checkout.
-- The secure checkout flow creates a pending booking FIRST, then reserves the
-- coupon — therefore booking_id is NOT NULL.
--
-- Only one active reservation may exist per booking (enforced by partial index).
-- A second different voucher may not be reserved for the same booking while
-- another reservation is active (same partial index on booking_id enforces this).
--
-- Constraints:
--   - voucher_id, booking_id, and user_id use ON DELETE RESTRICT to protect the
--     financial audit records from cascade deletions.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.voucher_reservations (
    id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    voucher_id       UUID          NOT NULL REFERENCES public.vouchers(id) ON DELETE RESTRICT,

    -- booking_id is NOT NULL: booking must exist before reservation
    booking_id       UUID          NOT NULL REFERENCES public.bookings(id) ON DELETE RESTRICT,

    user_id          UUID          NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    reserved_amount  NUMERIC(12,2) NOT NULL CHECK (reserved_amount > 0),

    -- Status lifecycle
    -- pending         : hold created, waiting for payment order
    -- payment_pending : Razorpay order created, awaiting payment result
    -- redeemed        : payment verified, balance permanently deducted
    -- released        : hold cancelled (user dismissed, payment failed)
    -- expired         : hold expired before payment completed
    status           TEXT          NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'payment_pending', 'redeemed', 'released', 'expired')),

    expires_at       TIMESTAMPTZ   NOT NULL,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    -- Expiry must be in the future relative to creation
    CONSTRAINT check_reservation_expiry_after_creation
        CHECK (expires_at > created_at)
);

-- Only one active reservation per booking (pending or payment_pending).
-- This also prevents reserving a second different voucher for the same booking
-- while another active reservation exists.
CREATE UNIQUE INDEX IF NOT EXISTS idx_voucher_reservations_one_active_per_booking
    ON public.voucher_reservations (booking_id)
    WHERE status IN ('pending', 'payment_pending');

CREATE INDEX IF NOT EXISTS idx_voucher_reservations_voucher_id
    ON public.voucher_reservations (voucher_id);
CREATE INDEX IF NOT EXISTS idx_voucher_reservations_user_id
    ON public.voucher_reservations (user_id);
CREATE INDEX IF NOT EXISTS idx_voucher_reservations_status
    ON public.voucher_reservations (status);
-- Partial index for active reservation balance-hold lookups (high-frequency path)
CREATE INDEX IF NOT EXISTS idx_voucher_reservations_active
    ON public.voucher_reservations (voucher_id, expires_at)
    WHERE status IN ('pending', 'payment_pending');


-- ============================================================================
-- SECTION E: PAYMENT ATTEMPTS
-- ============================================================================
-- One attempt per idempotency_key. The Edge Function creates this row in
-- 'preparing' status, stores the Razorpay order ID, then advances through:
--   preparing -> order_created -> verification_pending -> verified | failed
--
-- Financial integrity notes:
--   - booking_id uses ON DELETE RESTRICT: deleting a booking with active payment
--     attempts is prohibited. This prevents silent data loss.
--   - user_id uses ON DELETE SET NULL: if an account is deleted, the attempt row
--     is retained for financial audit with user_id nulled out.
--   - razorpay_order_id and razorpay_payment_id are UNIQUE — no separate indexes
--     needed (unique constraint already creates an index).
--   - reservation_id is UNIQUE (NULL allowed): a reservation can belong to at
--     most one payment attempt.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.payment_attempts (
    id                    UUID         PRIMARY KEY DEFAULT gen_random_uuid(),

    -- ON DELETE SET NULL: retain attempt rows for audit if user account deleted
    user_id               UUID         REFERENCES auth.users(id) ON DELETE SET NULL,

    -- ON DELETE RESTRICT: cannot delete a booking that has payment attempts
    booking_id            UUID         NOT NULL REFERENCES public.bookings(id) ON DELETE RESTRICT,

    -- UNIQUE NULL-allowed: at most one active attempt per reservation
    reservation_id        UUID         UNIQUE
        REFERENCES public.voucher_reservations(id) ON DELETE SET NULL,

    -- Duplicate-submission guard (server-generated receipt for Razorpay order)
    idempotency_key       UUID         NOT NULL UNIQUE,

    -- Server-generated receipt identifier sent to Razorpay at order creation
    -- Must be unique and non-null; generated by the Edge Function
    receipt               TEXT         NOT NULL UNIQUE,

    -- Concurrency claim: only the holder of this token may advance the attempt
    claim_token           UUID,
    claim_expires_at      TIMESTAMPTZ,

    -- Razorpay identifiers — UNIQUE constraint creates the index; no separate index needed
    razorpay_order_id     TEXT         UNIQUE,
    razorpay_payment_id   TEXT         UNIQUE,

    -- Expected amount in paise (must be > 0; INR only)
    expected_amount_paise BIGINT       NOT NULL CHECK (expected_amount_paise > 0),
    currency              TEXT         NOT NULL DEFAULT 'INR'
        CHECK (currency = 'INR'),

    -- Status lifecycle
    -- preparing           : RPC locked, computing server-side amount
    -- order_created       : Razorpay order created, modal not yet opened
    -- verification_pending: payment completed by user, signature check pending
    -- verified            : signature and amount confirmed server-side
    -- failed              : payment failed or signature invalid
    -- cancelled           : user dismissed or attempt abandoned
    -- expired             : claim_expires_at passed without order creation
    status                TEXT         NOT NULL DEFAULT 'preparing'
        CHECK (status IN (
            'preparing',
            'order_created',
            'verification_pending',
            'verified',
            'failed',
            'cancelled',
            'expired'
        )),

    failure_reason        TEXT,

    -- Timestamps for audit and SLA tracking
    created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    order_created_at      TIMESTAMPTZ,
    verified_at           TIMESTAMPTZ,
    updated_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    -- Optional: auto-expire stale attempts
    expires_at            TIMESTAMPTZ,

    -- claim_expires_at must be after creation when set
    CONSTRAINT check_claim_expiry_after_creation
        CHECK (claim_expires_at IS NULL OR claim_expires_at > created_at),

    -- Razorpay receipt length restriction (1 to 40 characters)
    CONSTRAINT check_payment_attempts_receipt_length
        CHECK (length(receipt) BETWEEN 1 AND 40)
);

-- Only one active attempt per booking (preparing, order_created, verification_pending)
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_attempts_one_active_per_booking
    ON public.payment_attempts (booking_id)
    WHERE status IN ('preparing', 'order_created', 'verification_pending');

-- Composite index for common admin lookup: booking + user
CREATE INDEX IF NOT EXISTS idx_payment_attempts_booking_user
    ON public.payment_attempts (booking_id, user_id);

CREATE INDEX IF NOT EXISTS idx_payment_attempts_status
    ON public.payment_attempts (status);

-- NOTE: razorpay_order_id, razorpay_payment_id, idempotency_key, receipt and
-- reservation_id all have UNIQUE constraints which already create B-tree indexes.
-- No additional non-unique indexes are created for those columns.


-- ============================================================================
-- SECTION F: VOUCHER REDEMPTIONS
-- ============================================================================
-- Written exactly once per reservation when payment is verified or a full
-- voucher (₹0 Razorpay) checkout completes. Immutable audit ledger record.
-- Mutations must go through the service-role RPC only.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.voucher_redemptions (
    id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),

    -- One redemption record per reservation (1:1)
    reservation_id      UUID          NOT NULL UNIQUE
        REFERENCES public.voucher_reservations(id) ON DELETE RESTRICT,

    voucher_id          UUID          NOT NULL
        REFERENCES public.vouchers(id) ON DELETE RESTRICT,

    -- One redemption per booking (system allows one coupon per booking)
    booking_id          UUID          NOT NULL UNIQUE
        REFERENCES public.bookings(id) ON DELETE RESTRICT,

    -- Optional: link to the payment attempt that triggered this redemption.
    -- NULL for full-voucher (₹0 Razorpay) checkouts.
    -- Partial unique index below enforces at-most-one redemption per attempt.
    payment_attempt_id  UUID
        REFERENCES public.payment_attempts(id) ON DELETE SET NULL,

    -- Amount deducted in this redemption
    amount_used         NUMERIC(12,2) NOT NULL CHECK (amount_used > 0),

    -- Balance snapshot for audit / reconciliation
    balance_before      NUMERIC(12,2) NOT NULL CHECK (balance_before >= 0),
    balance_after       NUMERIC(12,2) NOT NULL CHECK (balance_after >= 0),

    -- Who triggered the redemption (user or admin)
    redeemed_by         UUID          REFERENCES auth.users(id) ON DELETE SET NULL,
    redeemed_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    -- Exact balance math must hold: balance_before - amount_used = balance_after
    CONSTRAINT check_redemption_balance_math
        CHECK (balance_before - amount_used = balance_after),

    -- Safety: amount_used must not exceed the balance available before deduction
    CONSTRAINT check_redemption_amount_not_exceed
        CHECK (amount_used <= balance_before)
);

-- One redemption per non-null payment attempt (NULL allowed for voucher-only flow)
CREATE UNIQUE INDEX IF NOT EXISTS idx_voucher_redemptions_payment_attempt_unique
    ON public.voucher_redemptions (payment_attempt_id)
    WHERE payment_attempt_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_voucher_redemptions_voucher_id
    ON public.voucher_redemptions (voucher_id);

-- booking_id already has a UNIQUE constraint; no additional index needed.
-- reservation_id already has a UNIQUE constraint; no additional index needed.


-- ============================================================================
-- SECTION G: ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.vouchers               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voucher_internal_notes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voucher_reservations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voucher_redemptions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_attempts       ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------------
-- VOUCHERS POLICIES
-- Vouchers must only be issued through cancellation or service-recovery RPCs.
-- Direct INSERT and UPDATE are prohibited for both customers and admins.
-- Customer/Admin: SELECT only (admin can see all, customer sees own).
-- --------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admin SELECT vouchers"        ON public.vouchers;
DROP POLICY IF EXISTS "Admin INSERT vouchers"        ON public.vouchers;
DROP POLICY IF EXISTS "Admin UPDATE vouchers"        ON public.vouchers;
DROP POLICY IF EXISTS "Admin DELETE vouchers"        ON public.vouchers;
DROP POLICY IF EXISTS "Customer SELECT own vouchers" ON public.vouchers;

CREATE POLICY "Admin SELECT vouchers"
    ON public.vouchers
    FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- No direct INSERT or UPDATE policies are created for vouchers.
-- Creation and updates are performed strictly through security definer RPCs.

-- Customer: own vouchers only; user_id IS NOT NULL prevents null-match on
-- pending_link and unlinked vouchers; pending_link and cancelled are excluded.
CREATE POLICY "Customer SELECT own vouchers"
    ON public.vouchers
    FOR SELECT
    TO authenticated
    USING (
        user_id IS NOT NULL
        AND user_id = auth.uid()
        AND status NOT IN ('pending_link', 'cancelled')
    );

-- --------------------------------------------------------------------------
-- VOUCHER INTERNAL NOTES POLICIES
-- Admin full CRUD — customers must never see internal notes
-- --------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admin SELECT internal notes" ON public.voucher_internal_notes;
DROP POLICY IF EXISTS "Admin INSERT internal notes" ON public.voucher_internal_notes;
DROP POLICY IF EXISTS "Admin UPDATE internal notes" ON public.voucher_internal_notes;
DROP POLICY IF EXISTS "Admin DELETE internal notes" ON public.voucher_internal_notes;

CREATE POLICY "Admin SELECT internal notes"
    ON public.voucher_internal_notes
    FOR SELECT
    TO authenticated
    USING (public.is_admin());

CREATE POLICY "Admin INSERT internal notes"
    ON public.voucher_internal_notes
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

CREATE POLICY "Admin UPDATE internal notes"
    ON public.voucher_internal_notes
    FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Admin DELETE internal notes"
    ON public.voucher_internal_notes
    FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- --------------------------------------------------------------------------
-- VOUCHER RESERVATIONS POLICIES
-- Admin: SELECT only for visibility
-- No direct INSERT / UPDATE / DELETE for anyone — mutations use RPCs only
-- --------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admin SELECT reservations" ON public.voucher_reservations;
DROP POLICY IF EXISTS "Admin INSERT reservations" ON public.voucher_reservations;
DROP POLICY IF EXISTS "Admin UPDATE reservations" ON public.voucher_reservations;
DROP POLICY IF EXISTS "Admin DELETE reservations" ON public.voucher_reservations;

CREATE POLICY "Admin SELECT reservations"
    ON public.voucher_reservations
    FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- NOTE: No INSERT, UPDATE or DELETE policies for any role.
-- All reservation mutations are performed exclusively by service_role RPCs,
-- which bypass RLS. No customer or admin path exists for direct table writes.

-- --------------------------------------------------------------------------
-- VOUCHER REDEMPTIONS POLICIES
-- Admin: SELECT only for reconciliation
-- Customer: SELECT own redemptions only (via voucher ownership)
-- No direct INSERT / UPDATE / DELETE — ledger is append-only via service-role RPC
-- --------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admin SELECT redemptions"        ON public.voucher_redemptions;
DROP POLICY IF EXISTS "Admin INSERT redemptions"        ON public.voucher_redemptions;
DROP POLICY IF EXISTS "Admin UPDATE redemptions"        ON public.voucher_redemptions;
DROP POLICY IF EXISTS "Admin DELETE redemptions"        ON public.voucher_redemptions;
DROP POLICY IF EXISTS "Customer SELECT own redemptions" ON public.voucher_redemptions;

CREATE POLICY "Admin SELECT redemptions"
    ON public.voucher_redemptions
    FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- Customer may SELECT only redemptions where they own the parent voucher.
-- user_id IS NOT NULL guard prevents matching unlinked pending_link vouchers.
CREATE POLICY "Customer SELECT own redemptions"
    ON public.voucher_redemptions
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.vouchers v
            WHERE v.id = voucher_redemptions.voucher_id
              AND v.user_id IS NOT NULL
              AND v.user_id = auth.uid()
        )
    );

-- NOTE: No INSERT, UPDATE or DELETE policies for any role.
-- The redemption ledger is written exclusively by the service_role Edge Function.

-- --------------------------------------------------------------------------
-- PAYMENT ATTEMPTS POLICIES
-- Admin: SELECT only for monitoring and reconciliation
-- No direct writes for any role — all mutations use service_role Edge Function
-- Reconciliation corrections will use a later restricted service-role RPC
-- --------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admin SELECT payment attempts" ON public.payment_attempts;
DROP POLICY IF EXISTS "Admin UPDATE payment attempts" ON public.payment_attempts;

CREATE POLICY "Admin SELECT payment attempts"
    ON public.payment_attempts
    FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- NOTE: No INSERT, UPDATE or DELETE policies for any role.
-- Direct table updates are prohibited.
-- The Edge Function operates as service_role and bypasses RLS for all writes.


-- ============================================================================
-- SECTION H: TABLE-LEVEL PRIVILEGE GRANTS (defence-in-depth)
-- ============================================================================
-- These grants operate beneath RLS and restrict what SQL operations each role
-- may even attempt on each table, before RLS policies are evaluated.
-- ============================================================================

-- Revoke all public/anon access on all five new tables
REVOKE ALL ON public.vouchers               FROM PUBLIC, anon;
REVOKE ALL ON public.voucher_internal_notes  FROM PUBLIC, anon;
REVOKE ALL ON public.voucher_reservations   FROM PUBLIC, anon;
REVOKE ALL ON public.voucher_redemptions    FROM PUBLIC, anon;
REVOKE ALL ON public.payment_attempts       FROM PUBLIC, anon;

-- Revoke all authenticated privileges from all five tables first (explicit clean state)
REVOKE ALL ON public.vouchers               FROM authenticated;
REVOKE ALL ON public.voucher_internal_notes  FROM authenticated;
REVOKE ALL ON public.voucher_reservations   FROM authenticated;
REVOKE ALL ON public.voucher_redemptions    FROM authenticated;
REVOKE ALL ON public.payment_attempts       FROM authenticated;

-- Revoke all service_role privileges on each new financial table first (explicit clean state)
REVOKE ALL ON public.vouchers               FROM service_role;
REVOKE ALL ON public.voucher_internal_notes  FROM service_role;
REVOKE ALL ON public.voucher_reservations   FROM service_role;
REVOKE ALL ON public.voucher_redemptions    FROM service_role;
REVOKE ALL ON public.payment_attempts       FROM service_role;

-- VOUCHERS
-- authenticated: SELECT only (own + admin)
GRANT SELECT ON public.vouchers TO authenticated;
-- service_role: operational access without DELETE
GRANT SELECT, INSERT, UPDATE ON public.vouchers TO service_role;

-- VOUCHER INTERNAL NOTES
-- authenticated: full CRUD (all operations are admin-only via RLS)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.voucher_internal_notes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.voucher_internal_notes TO service_role;

-- VOUCHER RESERVATIONS
-- authenticated: SELECT only (admin-only via RLS)
GRANT SELECT ON public.voucher_reservations TO authenticated;
-- service_role: operational access without DELETE
GRANT SELECT, INSERT, UPDATE ON public.voucher_reservations TO service_role;

-- VOUCHER REDEMPTIONS
-- authenticated: SELECT only (admin + customer own via RLS)
GRANT SELECT ON public.voucher_redemptions TO authenticated;
-- service_role: append-only operational access (no UPDATE, no DELETE)
GRANT SELECT, INSERT ON public.voucher_redemptions TO service_role;

-- PAYMENT ATTEMPTS
-- authenticated: SELECT only (admin-only via RLS); no customer direct path
GRANT SELECT ON public.payment_attempts TO authenticated;
-- service_role: operational access without DELETE
GRANT SELECT, INSERT, UPDATE ON public.payment_attempts TO service_role;


-- ============================================================================
-- SECTION I: CUSTOMER VOUCHERS VIEW
-- Uses security_invoker = true so the view executes under the calling user's
-- RLS context, not the definer's. The voucher SELECT policy is enforced
-- automatically. Internal notes, payment attempts and reservations are never
-- exposed.
-- ============================================================================

DROP VIEW IF EXISTS public.customer_vouchers_view;

CREATE VIEW public.customer_vouchers_view
    WITH (security_invoker = true)
AS
SELECT
    v.id,
    v.code,
    v.source_booking_id,
    v.source_type,
    v.original_amount,
    v.remaining_amount,
    v.issued_reason,
    v.valid_from,
    v.expires_at,
    v.status,
    v.created_at
FROM public.vouchers v
WHERE
    -- security_invoker enforces RLS; explicit filter added as defence-in-depth
    v.user_id IS NOT NULL
    AND v.user_id = (SELECT auth.uid())
    AND v.status NOT IN ('pending_link', 'cancelled');

-- Revoke broad access; grant SELECT only to authenticated users
REVOKE ALL ON public.customer_vouchers_view FROM PUBLIC, anon;
GRANT SELECT ON public.customer_vouchers_view TO authenticated;


-- ============================================================================
-- END OF SCHEMA FILE
-- ============================================================================
--
-- THIS FILE ONLY ADDS SCHEMA AND RLS.
-- IT MUST NOT BE RUN YET.
-- THE FOLLOWING MUST ALL BE REVIEWED AND DEPLOYED FIRST:
--   1. Separate future RPC migration (reserve, release, finalize, cancel,
--      service-recovery, pending-link account-linking RPCs)
--   2. Edge Function (razorpay-checkout) — deployed and verified in staging
--   3. Frontend checkout flow — updated to use Edge Function, not direct insert
-- ============================================================================

COMMIT;
