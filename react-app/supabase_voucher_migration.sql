-- ==========================================
-- Service Vouchers Table Migration
-- Run this in your Supabase SQL Editor
-- ==========================================

CREATE TABLE IF NOT EXISTS service_vouchers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  voucher_code TEXT UNIQUE NOT NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  traveller_id UUID,
  traveller_name TEXT NOT NULL,
  traveller_phone TEXT,
  traveller_email TEXT,
  package_title TEXT,
  booking_reference TEXT,
  reason TEXT,
  valid_until TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'claimed', 'expired')),
  claimed_at TIMESTAMPTZ,
  issued_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE service_vouchers ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users full access (admin)
CREATE POLICY "Allow authenticated full access" ON service_vouchers
  FOR ALL USING (auth.role() = 'authenticated');

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_vouchers_code ON service_vouchers(voucher_code);
CREATE INDEX IF NOT EXISTS idx_vouchers_status ON service_vouchers(status);
CREATE INDEX IF NOT EXISTS idx_vouchers_booking ON service_vouchers(booking_id);
