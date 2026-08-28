-- Add manual booking discount fields to bookings table
ALTER TABLE public.bookings
ADD COLUMN manual_discount_amount NUMERIC NOT NULL DEFAULT 0,
ADD CONSTRAINT check_manual_discount_amount 
CHECK (
  manual_discount_amount >= 0 
  AND manual_discount_amount <= COALESCE(total_amount, 0)
);
