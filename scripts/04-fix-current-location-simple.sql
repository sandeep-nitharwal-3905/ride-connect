-- Simple fix for missing current_location column
-- Run this if you're getting "column does not exist" errors

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS current_location TEXT;
