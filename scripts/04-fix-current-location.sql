-- Database Migration: Add current_location column if missing
-- Run this to fix the current_location column error

-- Check if column exists and add it if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'bookings' 
        AND column_name = 'current_location'
    ) THEN
        ALTER TABLE bookings ADD COLUMN current_location TEXT;
        RAISE NOTICE 'Added current_location column to bookings table';
    ELSE
        RAISE NOTICE 'current_location column already exists';
    END IF;
END $$;

-- Update any missing timestamps
UPDATE bookings 
SET updated_at = NOW() 
WHERE updated_at IS NULL;
