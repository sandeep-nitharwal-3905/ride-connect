-- Add missing columns to bookings table for passenger info and vehicle type
-- Run this migration to fix the database schema

-- Add passenger_name column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'passenger_name'
    ) THEN
        ALTER TABLE bookings ADD COLUMN passenger_name TEXT;
        RAISE NOTICE 'Added passenger_name column to bookings table';
    ELSE
        RAISE NOTICE 'passenger_name column already exists';
    END IF;
END $$;

-- Add passenger_phone column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'passenger_phone'
    ) THEN
        ALTER TABLE bookings ADD COLUMN passenger_phone TEXT;
        RAISE NOTICE 'Added passenger_phone column to bookings table';
    ELSE
        RAISE NOTICE 'passenger_phone column already exists';
    END IF;
END $$;

-- Add vehicle_type column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'vehicle_type'
    ) THEN
        ALTER TABLE bookings ADD COLUMN vehicle_type TEXT;
        RAISE NOTICE 'Added vehicle_type column to bookings table';
    ELSE
        RAISE NOTICE 'vehicle_type column already exists';
    END IF;
END $$;

-- Verify the table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'bookings' 
ORDER BY ordinal_position;
